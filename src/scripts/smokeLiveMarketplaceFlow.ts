import crypto from "node:crypto";
import dotenv from "dotenv";
import { AddressInfo } from "node:net";
import type { Prisma } from "@prisma/client";

import { createPublicClient, createWalletClient, erc20Abi, formatUnits, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { GatewayClient, type PayResult } from "@circle-fin/x402-batching/client";

import app from "../app.js";
import { prisma, ensureSeedData } from "../db.js";
import { arcTestnet, signWalletToken } from "../services/arc.js";

dotenv.config();

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

async function recordNanopaymentEvent(input: {
  kind: "buyer_native_funding" | "buyer_usdc_funding" | "gateway_deposit";
  jobId: string;
  milestoneId: string;
  payerAddress: string;
  sellerAddress?: string | null;
  network: string;
  assetAddress?: string | null;
  amount?: string | null;
  transactionRef: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.nanopaymentEvent.create({
    data: {
      id: `npe_${crypto.randomUUID()}`,
      kind: input.kind,
      jobId: input.jobId,
      milestoneId: input.milestoneId,
      payerAddress: input.payerAddress,
      sellerAddress: input.sellerAddress ?? null,
      network: input.network,
      assetAddress: input.assetAddress ?? null,
      amount: input.amount ?? null,
      transactionRef: input.transactionRef,
      metadata: input.metadata
    }
  });
}

const smokeProofUrl =
  process.env.SMOKE_PROOF_URL ??
  "https://github.com/genlayerlabs/genlayer-docs/blob/main/pages/developers/intelligent-contracts/introduction.mdx";

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for the marketplace smoke test.`);
  }

  return value;
}

function getAllowedDomains() {
  return (process.env.GENLAYER_ALLOWED_DOMAINS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function getPreviewPriceDecimal() {
  const rawValue = process.env.NANOPAYMENTS_PREMIUM_PREVIEW_PRICE_USD ?? "0.000001";
  return rawValue.startsWith("$") ? rawValue.slice(1) : rawValue;
}

async function requestJson<T>(baseUrl: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, init);
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as JsonValue) : null;

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} on ${path}: ${JSON.stringify(payload)}`);
  }

  return payload as T;
}

async function payProtectedJson<T>(
  gateway: GatewayClient,
  url: string,
  body: Record<string, unknown>
): Promise<PayResult<T>> {
  const headers = { "content-type": "application/json" };
  const serializedBody = JSON.stringify(body);
  const initialResponse = await fetch(url, {
    method: "POST",
    headers,
    body: serializedBody
  });

  if (initialResponse.status !== 402) {
    const text = await initialResponse.text();

    if (!initialResponse.ok) {
      throw new Error(`Initial paid request failed (${initialResponse.status}): ${text}`);
    }

    return {
      status: initialResponse.status,
      amount: 0n,
      formattedAmount: "0",
      transaction: "",
      data: (text ? JSON.parse(text) : null) as T
    };
  }

  const paymentRequiredHeader = initialResponse.headers.get("PAYMENT-REQUIRED");

  if (!paymentRequiredHeader) {
    throw new Error("Missing PAYMENT-REQUIRED header in premium preview challenge.");
  }

  const paymentRequired = JSON.parse(Buffer.from(paymentRequiredHeader, "base64").toString("utf-8")) as {
    x402Version?: number;
    resource?: Record<string, unknown>;
    accepts?: Array<{
      amount: string;
      network: string;
      extra?: { verifyingContract?: string };
    }>;
  };

  const expectedNetwork = `eip155:${gateway.chainConfig.chain.id}`;
  const batchingOption = paymentRequired.accepts?.find(
    (option) => option.network === expectedNetwork && typeof option.extra?.verifyingContract === "string"
  );

  if (!batchingOption) {
    throw new Error(`No Gateway batching option available for ${expectedNetwork}.`);
  }

  const paymentPayload = await (gateway as any).createPaymentPayload(paymentRequired.x402Version ?? 2, batchingOption);
  const paymentHeader = Buffer.from(
    JSON.stringify({
      ...paymentPayload,
      resource: paymentRequired.resource,
      accepted: batchingOption
    })
  ).toString("base64");

  const paidResponse = await fetch(url, {
    method: "POST",
    headers: {
      ...headers,
      "Payment-Signature": paymentHeader
    },
    body: serializedBody
  });
  const paidText = await paidResponse.text();

  if (!paidResponse.ok) {
    throw new Error(`Paid preview failed (${paidResponse.status}): ${paidText}`);
  }

  const paymentResponseHeader = paidResponse.headers.get("PAYMENT-RESPONSE");
  const transaction = paymentResponseHeader
    ? ((JSON.parse(Buffer.from(paymentResponseHeader, "base64").toString("utf-8")) as { transaction?: string })
        .transaction ?? "")
    : "";
  const amount = BigInt(batchingOption.amount);

  return {
    status: paidResponse.status,
    amount,
    formattedAmount: formatUnits(amount, 6),
    transaction,
    data: (paidText ? JSON.parse(paidText) : null) as T
  };
}

async function main() {
  requireEnv("ARC_RELAYER_PRIVATE_KEY");
  requireEnv("ARC_ESCROW_CONTRACT_ADDRESS");
  requireEnv("GENLAYER_RPC_URL");
  requireEnv("GENLAYER_VERIFIER_CONTRACT_ADDRESS");
  requireEnv("NANOPAYMENTS_SELLER_ADDRESS");

  const proofDomain = new URL(smokeProofUrl).hostname.toLowerCase();
  const allowedDomains = getAllowedDomains();

  if (allowedDomains.length > 0 && !allowedDomains.includes(proofDomain)) {
    throw new Error(
      `SMOKE_PROOF_URL domain ${proofDomain} is not allowed by GENLAYER_ALLOWED_DOMAINS=${allowedDomains.join(",")}.`
    );
  }

  const relayer = privateKeyToAccount(process.env.ARC_RELAYER_PRIVATE_KEY as `0x${string}`);
  const authToken = signWalletToken({
    address: relayer.address,
    chainId: Number(process.env.ARC_CHAIN_ID ?? 5042002),
    actorId: "client_1"
  });

  const previewPriceDecimal = getPreviewPriceDecimal();
  const previewPriceAtomic = parseUnits(previewPriceDecimal, 6);
  const minimumGatewayDepositDecimal = "0.00001";
  const minimumGatewayDepositAtomic = parseUnits(minimumGatewayDepositDecimal, 6);

  await prisma.$connect();
  await ensureSeedData();

  const server = app.listen(0);

  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.once("listening", () => resolve());
    });

    const { port } = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${port}`;
    const suffix = crypto.randomUUID().slice(0, 8);
    const buyerPrivateKey = `0x${crypto.randomBytes(32).toString("hex")}` as `0x${string}`;
    const buyer = privateKeyToAccount(buyerPrivateKey);
    const arcPublicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.network")
    });
    const arcWalletClient = createWalletClient({
      account: relayer,
      chain: arcTestnet,
      transport: http(process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.network")
    });
    const gateway = new GatewayClient({ chain: "arcTestnet", privateKey: buyerPrivateKey });
    const buyerUsdcFundingAmount = "0.01";
    const buyerNativeFundingAmount = parseUnits("0.01", 18);

    const nativeFundingHash = await arcWalletClient.sendTransaction({
      to: buyer.address,
      value: buyerNativeFundingAmount,
      account: relayer,
      chain: arcTestnet
    });
    await arcPublicClient.waitForTransactionReceipt({ hash: nativeFundingHash });

    const usdcFundingHash = await arcWalletClient.writeContract({
      address: gateway.chainConfig.usdc,
      abi: erc20Abi,
      functionName: "transfer",
      args: [buyer.address, parseUnits(buyerUsdcFundingAmount, 6)],
      account: relayer,
      chain: arcTestnet
    });
    await arcPublicClient.waitForTransactionReceipt({ hash: usdcFundingHash });

    const job = await requestJson<{
      id: string;
      status: string;
      milestones: Array<{ id: string; status: string }>;
    }>(baseUrl, "/jobs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: `Marketplace Smoke ${suffix}`,
        description: "Live smoke for create, accept, paid preview, GenLayer verification, and Arc release.",
        clientId: "client_1",
        workerId: "worker_1",
        categoryTags: ["smoke", "marketplace", "nanopayments", "genlayer", "arc"],
        milestones: [
          {
            title: "Verify official docs evidence",
            description: "Confirm the linked official documentation clearly mentions @gl.public.view for intelligent contracts.",
            amountUsd: 0.000001,
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            proofRequirements: [
              "Provide a public proof URL from an allowed domain.",
              "The page must explicitly mention `@gl.public.view`."
            ],
            acceptanceCriteria: [
              "The proof page explicitly contains `@gl.public.view`.",
              "The proof page comes from an allowed domain and supports the submission summary."
            ]
          }
        ]
      })
    });

    const milestoneId = job.milestones[0]?.id;
    if (!milestoneId) {
      throw new Error("Marketplace smoke job did not return a milestone id.");
    }

    await recordNanopaymentEvent({
      kind: "buyer_native_funding",
      jobId: job.id,
      milestoneId,
      payerAddress: relayer.address,
      sellerAddress: process.env.NANOPAYMENTS_SELLER_ADDRESS ?? null,
      network: `eip155:${arcTestnet.id}`,
      amount: buyerNativeFundingAmount.toString(),
      transactionRef: nativeFundingHash,
      metadata: { fundedBuyerAddress: buyer.address, asset: "native" }
    });

    await recordNanopaymentEvent({
      kind: "buyer_usdc_funding",
      jobId: job.id,
      milestoneId,
      payerAddress: relayer.address,
      sellerAddress: process.env.NANOPAYMENTS_SELLER_ADDRESS ?? null,
      network: `eip155:${arcTestnet.id}`,
      assetAddress: gateway.chainConfig.usdc,
      amount: parseUnits(buyerUsdcFundingAmount, 6).toString(),
      transactionRef: usdcFundingHash,
      metadata: { fundedBuyerAddress: buyer.address, formattedAmount: buyerUsdcFundingAmount }
    });

    const acceptedJob = await requestJson<{ accepted: boolean; job: { status: string } }>(baseUrl, `/jobs/${job.id}/accept`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ workerId: "worker_1" })
    });

    if (!acceptedJob.accepted || acceptedJob.job.status !== "in_progress") {
      throw new Error(`Expected accepted in_progress job, received ${JSON.stringify(acceptedJob)}`);
    }

    const arcFunding = await requestJson<{
      arcJobId: string;
      transaction: { hash: string };
    }>(baseUrl, `/jobs/${job.id}/arc/fund`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${authToken}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        clientAddress: relayer.address,
        workerAddress: buyer.address
      })
    });

    const balancesBefore = await gateway.getBalances();
    let depositResult: { depositTxHash: string; formattedAmount: string } | null = null;

    if (balancesBefore.gateway.available < previewPriceAtomic) {
      const depositAmount = previewPriceAtomic < minimumGatewayDepositAtomic ? minimumGatewayDepositDecimal : previewPriceDecimal;
      const deposit = await gateway.deposit(depositAmount);
      depositResult = {
        depositTxHash: deposit.depositTxHash,
        formattedAmount: deposit.formattedAmount
      };

      await recordNanopaymentEvent({
        kind: "gateway_deposit",
        jobId: job.id,
        milestoneId,
        payerAddress: buyer.address,
        sellerAddress: process.env.NANOPAYMENTS_SELLER_ADDRESS ?? null,
        network: `eip155:${gateway.chainConfig.chain.id}`,
        assetAddress: gateway.chainConfig.usdc,
        amount: deposit.amount.toString(),
        transactionRef: deposit.depositTxHash,
        metadata: { approvalTxHash: deposit.approvalTxHash ?? null, formattedAmount: deposit.formattedAmount }
      });
    }

    let balancesReady = await gateway.getBalances();

    if (balancesReady.gateway.available < previewPriceAtomic) {
      const topUpDeposit = await gateway.deposit(minimumGatewayDepositDecimal);
      depositResult = {
        depositTxHash: topUpDeposit.depositTxHash,
        formattedAmount: topUpDeposit.formattedAmount
      };

      await recordNanopaymentEvent({
        kind: "gateway_deposit",
        jobId: job.id,
        milestoneId,
        payerAddress: buyer.address,
        sellerAddress: process.env.NANOPAYMENTS_SELLER_ADDRESS ?? null,
        network: `eip155:${gateway.chainConfig.chain.id}`,
        assetAddress: gateway.chainConfig.usdc,
        amount: topUpDeposit.amount.toString(),
        transactionRef: topUpDeposit.depositTxHash,
        metadata: { approvalTxHash: topUpDeposit.approvalTxHash ?? null, formattedAmount: topUpDeposit.formattedAmount }
      });
      balancesReady = await gateway.getBalances();
    }

    if (balancesReady.gateway.available < previewPriceAtomic) {
      throw new Error(
        `Gateway balance still below preview price after deposit. available=${balancesReady.gateway.available.toString()} required=${previewPriceAtomic.toString()}`
      );
    }

    const paidPreview = await payProtectedJson<{
      paid: boolean;
      payment: { verified: boolean; transaction: string | null } | null;
      preview: { likelyOutcome: string; recommendation: string };
    }>(gateway, `${baseUrl}/premium/verification-preview`, {
      title: `Marketplace Smoke ${suffix}`,
      description: "Check whether a worker submission is ready before final verification and release.",
      acceptanceCriteria: [
        "The proof page explicitly contains `@gl.public.view`.",
        "The proof page comes from an allowed domain and supports the submission summary."
      ],
      proofRequirements: [
        "Provide a public proof URL from an allowed domain.",
        "The page must explicitly mention `@gl.public.view`."
      ],
      summary:
        "The worker completed the task and attached the official GenLayer docs page that explicitly documents the @gl.public.view decorator.",
      proofLinks: [smokeProofUrl],
      notes: "Paid preview before final submission.",
      jobId: job.id,
      milestoneId
    });

    if (paidPreview.status !== 200 || !paidPreview.data.paid || !paidPreview.data.payment?.verified) {
      throw new Error(`Expected successful paid preview, received ${JSON.stringify(paidPreview.data)}`);
    }

    const submissionResponse = await requestJson<{
      verification: {
        verdict: string;
        source: string;
        confidence: number;
        reasons: string[];
        externalRef?: string | null;
      };
      milestone: { status: string } | null;
    }>(baseUrl, `/jobs/${job.id}/milestones/${milestoneId}/submissions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        submitterId: "worker_1",
        summary:
          "Submitted the official GenLayer intelligent-contract introduction page, which explicitly documents the @gl.public.view decorator for read methods.",
        proofLinks: [smokeProofUrl],
        notes: "The worker accepted the job, ran the paid preview, and is submitting the final proof for GenLayer verification."
      })
    });

    if (submissionResponse.verification.source !== "genlayer") {
      throw new Error(`Expected GenLayer verification, received ${submissionResponse.verification.source}.`);
    }

    if (submissionResponse.verification.verdict !== "approved") {
      throw new Error(
        `Expected approved verification, received ${submissionResponse.verification.verdict}: ${submissionResponse.verification.reasons.join(" | ")}`
      );
    }

    const genlayerExternalRef = submissionResponse.verification.externalRef ?? null;
    const genlayerStatus = genlayerExternalRef
      ? await requestJson<JsonValue>(baseUrl, `/genlayer/transactions/${genlayerExternalRef}/status`)
      : null;
    const genlayerReceipt = genlayerExternalRef
      ? await requestJson<JsonValue>(baseUrl, `/genlayer/transactions/${genlayerExternalRef}/receipt`)
      : null;

    const releaseResponse = await requestJson<{
      payoutStatus: string;
      milestone: { status: string; arcTxHash?: string | null };
      arcSync: { hash: string } | null;
    }>(baseUrl, `/jobs/${job.id}/milestones/${milestoneId}/release`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });

    if (releaseResponse.payoutStatus !== "released" || releaseResponse.milestone.status !== "released") {
      throw new Error(`Expected released payout, received ${JSON.stringify(releaseResponse)}`);
    }

    const onchainState = await requestJson<{
      arcJobId: string;
      onchainJob: unknown;
      milestones: Array<{ milestoneId: string; onchain: unknown }>;
    }>(baseUrl, `/jobs/${job.id}/arc`);

    console.log(
      JSON.stringify(
        {
          smoke: "passed",
          flow: "marketplace-human-nanopayment",
          jobId: job.id,
          milestoneId,
          acceptedJobStatus: acceptedJob.job.status,
          buyerAddress: buyer.address,
          sellerAddress: process.env.NANOPAYMENTS_SELLER_ADDRESS,
          buyerNativeFundingTx: nativeFundingHash,
          buyerUsdcFundingTx: usdcFundingHash,
          buyerUsdcFundingAmount,
          depositTxHash: depositResult?.depositTxHash ?? null,
          depositAmount: depositResult?.formattedAmount ?? null,
          gatewayAvailableBefore: balancesBefore.gateway.available.toString(),
          gatewayAvailableReady: balancesReady.gateway.available.toString(),
          previewPaymentAmount: paidPreview.formattedAmount,
          previewPaymentTx: paidPreview.transaction,
          previewOutcome: paidPreview.data.preview.likelyOutcome,
          verification: submissionResponse.verification,
          genlayerExternalRef,
          genlayerStatus,
          genlayerReceipt,
          fundingTxHash: arcFunding.transaction.hash,
          releaseTxHash: releaseResponse.arcSync?.hash ?? releaseResponse.milestone.arcTxHash ?? null,
          arcJobId: onchainState.arcJobId,
          proofUrl: smokeProofUrl,
          verifierContractAddress: process.env.GENLAYER_VERIFIER_CONTRACT_ADDRESS
        },
        null,
        2
      )
    );
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});