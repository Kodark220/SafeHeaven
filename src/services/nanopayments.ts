import { CHAIN_CONFIGS } from "@circle-fin/x402-batching/client";
import { BatchFacilitatorClient, type PaymentRequest } from "@circle-fin/x402-batching/server";

const GATEWAY_BATCHING_NAME = "GatewayWalletBatched";
const GATEWAY_BATCHING_VERSION = "1";
const GATEWAY_SCHEME = "exact";
const GATEWAY_AUTH_VALIDITY_SECONDS = 7 * 24 * 60 * 60 + 3600;

type SupportedKind = {
  network: string;
  extra?: Record<string, unknown>;
};

type PaymentRequirements = {
  scheme: string;
  network: string;
  asset: string;
  amount: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra: {
    name: string;
    version: string;
    verifyingContract: string;
  };
};

type PaymentPayload = {
  accepted?: {
    network?: string;
  };
};

type PaymentResponseShape = {
  setHeader(name: string, value: string): void;
  end(body?: string): void;
  statusCode: number;
};

type NextFunction = (error?: unknown) => void;

function parseNetworks() {
  return (process.env.NANOPAYMENTS_NETWORKS ?? "eip155:5042002")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function parsePrice(price: string) {
  const numericPrice = price.replace(/[$]/g, "");
  const amount = Number.parseFloat(numericPrice);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`Invalid price: ${price}`);
  }

  return Math.round(amount * 1_000_000).toString();
}

function getUsdcAddress(network: string) {
  const config = Object.values(CHAIN_CONFIGS).find((entry) => `eip155:${entry.chain.id}` === network);
  return config?.usdc ?? null;
}

export function isNanopaymentsConfigured() {
  return Boolean(process.env.NANOPAYMENTS_SELLER_ADDRESS);
}

export function getNanopaymentPreviewPrice() {
  const amount = process.env.NANOPAYMENTS_PREMIUM_PREVIEW_PRICE_USD ?? "0.000001";
  return amount.startsWith("$") ? amount : `$${amount}`;
}

const gatewayMiddleware = (() => {
  if (!isNanopaymentsConfigured()) {
    return null;
  }

  const facilitator = new BatchFacilitatorClient({
    url: process.env.NANOPAYMENTS_FACILITATOR_URL ?? "https://gateway-api-testnet.circle.com"
  });
  const configuredNetworks = parseNetworks();
  const sellerAddress = process.env.NANOPAYMENTS_SELLER_ADDRESS!;
  let cachedSupportedKinds: SupportedKind[] | null = null;

  async function getSupportedKinds() {
    if (cachedSupportedKinds) {
      return cachedSupportedKinds;
    }

    const supported = await facilitator.getSupported();
    cachedSupportedKinds = supported.kinds.filter((kind) => typeof kind.extra?.verifyingContract === "string");
    return cachedSupportedKinds;
  }

  async function getAcceptedNetworks() {
    const supportedKinds = await getSupportedKinds();
    return supportedKinds.filter((kind) => configuredNetworks.includes(kind.network));
  }

  async function createAllPaymentRequirements(price: string): Promise<PaymentRequirements[]> {
    const networks = await getAcceptedNetworks();
    const amount = parsePrice(price);

    return networks
      .filter((kind) => getUsdcAddress(kind.network))
      .map((kind) => ({
        scheme: GATEWAY_SCHEME,
        network: kind.network,
        asset: getUsdcAddress(kind.network)!,
        amount,
        payTo: sellerAddress,
        maxTimeoutSeconds: GATEWAY_AUTH_VALIDITY_SECONDS,
        extra: {
          name: GATEWAY_BATCHING_NAME,
          version: GATEWAY_BATCHING_VERSION,
          verifyingContract: kind.extra!.verifyingContract as string
        }
      }));
  }

  async function createPaymentRequirements(price: string, network: string): Promise<PaymentRequirements | null> {
    const kind = (await getAcceptedNetworks()).find((entry) => entry.network === network);
    const usdcAddress = kind ? getUsdcAddress(kind.network) : null;

    if (!kind || !usdcAddress || typeof kind.extra?.verifyingContract !== "string") {
      return null;
    }

    return {
      scheme: GATEWAY_SCHEME,
      network: kind.network,
      asset: usdcAddress,
      amount: parsePrice(price),
      payTo: sellerAddress,
      maxTimeoutSeconds: GATEWAY_AUTH_VALIDITY_SECONDS,
      extra: {
        name: GATEWAY_BATCHING_NAME,
        version: GATEWAY_BATCHING_VERSION,
        verifyingContract: kind.extra.verifyingContract
      }
    };
  }

  function respondJson(response: PaymentResponseShape, statusCode: number, payload: unknown) {
    response.statusCode = statusCode;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify(payload));
  }

  return {
    require(price: string) {
      return async (request: PaymentRequest, response: PaymentResponseShape, next: NextFunction) => {
        try {
          const paymentHeader = request.headers["payment-signature"];

          if (!paymentHeader || Array.isArray(paymentHeader)) {
            const allRequirements = await createAllPaymentRequirements(price);

            if (allRequirements.length === 0) {
              respondJson(response, 503, { error: "No payment networks available" });
              return;
            }

            const paymentRequiredHeader = Buffer.from(
              JSON.stringify({
                x402Version: 2,
                resource: {
                  url: request.url ?? "/",
                  description: "Premium AI verification preview",
                  mimeType: "application/json"
                },
                accepts: allRequirements
              })
            ).toString("base64");

            response.statusCode = 402;
            response.setHeader("PAYMENT-REQUIRED", paymentRequiredHeader);
            response.setHeader("Content-Type", "application/json");
            response.end(JSON.stringify({}));
            return;
          }

          const paymentPayload = JSON.parse(Buffer.from(paymentHeader, "base64").toString("utf-8")) as PaymentPayload;
          const acceptedNetwork = paymentPayload.accepted?.network;

          if (!acceptedNetwork) {
            respondJson(response, 400, { error: "Missing accepted requirements in payment" });
            return;
          }

          const requirements = await createPaymentRequirements(price, acceptedNetwork);

          if (!requirements) {
            respondJson(response, 400, { error: `Network ${acceptedNetwork} not accepted` });
            return;
          }

          const verifyResult = await facilitator.verify(paymentPayload as never, requirements);

          if (!verifyResult.isValid) {
            respondJson(response, 402, { error: "Payment verification failed", reason: verifyResult.invalidReason });
            return;
          }

          const settleResult = await facilitator.settle(paymentPayload as never, requirements);

          if (!settleResult.success) {
            respondJson(response, 402, { error: "Payment settlement failed", reason: settleResult.errorReason });
            return;
          }

          request.payment = {
            verified: true,
            payer: settleResult.payer ?? verifyResult.payer ?? "",
            amount: parsePrice(price),
            network: requirements.network,
            transaction: settleResult.transaction
          };

          response.setHeader(
            "PAYMENT-RESPONSE",
            Buffer.from(
              JSON.stringify({
                success: true,
                transaction: settleResult.transaction,
                network: requirements.network,
                payer: settleResult.payer ?? verifyResult.payer ?? ""
              })
            ).toString("base64")
          );

          next();
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown payment processing error.";
          respondJson(response, 500, { error: "Payment processing error", message });
        }
      };
    }
  };
})();

export function requireNanopayment(price: string) {
  if (!gatewayMiddleware) {
    return (_request: unknown, _response: unknown, next: (error?: unknown) => void) => next();
  }

  return gatewayMiddleware.require(price);
}

export function getNanopaymentDetails(request: PaymentRequest) {
  return request.payment
    ? {
        verified: request.payment.verified,
        payer: request.payment.payer,
        amount: request.payment.amount,
        network: request.payment.network,
        transaction: request.payment.transaction ?? null
      }
    : null;
}