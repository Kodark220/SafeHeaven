import jwt from "jsonwebtoken";
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  erc20Abi,
  formatUnits,
  http,
  parseAbi,
  verifyMessage
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

type ArcAbi = unknown[];
type ArcAddress = `0x${string}` | string;
type ArcHex = `0x${string}` | string;

export const arcTestnet = defineChain({
  id: Number(process.env.ARC_CHAIN_ID ?? 5042002),
  name: "Arc Testnet",
  network: "arc-testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: [process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.network"]
    }
  },
  blockExplorers: {
    default: {
      name: "Arcscan",
      url: "https://testnet.arcscan.app"
    }
  },
  testnet: true
});

function getJwtSecret() {
  return process.env.JWT_SECRET ?? "dev-only-secret";
}

function normalizeAbi(abi: unknown): ArcAbi {
  if (!Array.isArray(abi)) {
    throw new Error("ABI must be an array.");
  }

  if (abi.every((entry) => typeof entry === "string")) {
    return parseAbi(abi as string[]);
  }

  return abi as ArcAbi;
}

export function getArcPublicClient() {
  return createPublicClient({
    chain: arcTestnet,
    transport: http(process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.network")
  });
}

function getRelayerAccount() {
  const privateKey = process.env.ARC_RELAYER_PRIVATE_KEY as ArcHex | undefined;
  if (!privateKey) {
    return undefined;
  }

  return privateKeyToAccount(privateKey);
}

function getArcWalletClient() {
  const account = getRelayerAccount();
  if (!account) {
    throw new Error("ARC_RELAYER_PRIVATE_KEY is not configured.");
  }

  return createWalletClient({
    account,
    chain: arcTestnet,
    transport: http(process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.network")
  });
}

export function isArcWriteConfigured(): boolean {
  return Boolean(process.env.ARC_RELAYER_PRIVATE_KEY);
}

export function signWalletToken(payload: { address: string; chainId: number; actorId?: string | null }) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyWalletToken(token: string) {
  return jwt.verify(token, getJwtSecret()) as { address: string; chainId: number; actorId?: string | null };
}

export function buildWalletMessage(input: { address: string; nonce: string; chainId: number; issuedAt: string }) {
  return [
    "Arc Verified Escrow Login",
    `Address: ${input.address}`,
    `Chain ID: ${input.chainId}`,
    `Nonce: ${input.nonce}`,
    `Issued At: ${input.issuedAt}`
  ].join("\n");
}

export async function verifyWalletChallenge(input: { address: ArcAddress; message: string; signature: ArcHex }) {
  return verifyMessage({
    address: input.address,
    message: input.message,
    signature: input.signature
  });
}

export async function getArcNetworkState() {
  const publicClient = getArcPublicClient();
  const [chainId, blockNumber] = await Promise.all([publicClient.getChainId(), publicClient.getBlockNumber()]);

  return {
    chainId,
    blockNumber: blockNumber.toString(),
    rpcUrl: process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.network",
    escrowContractAddress: process.env.ARC_ESCROW_CONTRACT_ADDRESS ?? null,
    relayerConfigured: isArcWriteConfigured()
  };
}

export async function getArcWalletState(address: ArcAddress) {
  const publicClient = getArcPublicClient();
  const nativeBalance = await publicClient.getBalance({ address });
  let erc20Balance: bigint | null = null;

  if (process.env.ARC_USDC_CONTRACT_ADDRESS) {
    erc20Balance = await publicClient.readContract({
      address: process.env.ARC_USDC_CONTRACT_ADDRESS as ArcAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address]
    });
  }

  return {
    address,
    nativeBalance: {
      raw: nativeBalance.toString(),
      formatted: formatUnits(nativeBalance, 18)
    },
    erc20UsdcBalance: erc20Balance === null ? null : { raw: erc20Balance.toString(), formatted: formatUnits(erc20Balance, 6) }
  };
}

export async function readArcContractState(input: {
  contractAddress: ArcAddress;
  abi: unknown;
  functionName: string;
  args?: unknown[];
}) {
  const publicClient = getArcPublicClient();
  return publicClient.readContract({
    address: input.contractAddress,
    abi: normalizeAbi(input.abi),
    functionName: input.functionName,
    args: (input.args ?? []) as readonly unknown[]
  });
}

export async function executeArcContractWrite(input: {
  contractAddress: ArcAddress;
  abi: unknown;
  functionName: string;
  args?: unknown[];
  value?: bigint;
}) {
  const walletClient = getArcWalletClient();
  const publicClient = getArcPublicClient();
  const hash = await walletClient.writeContract({
    address: input.contractAddress,
    abi: normalizeAbi(input.abi),
    functionName: input.functionName,
    args: (input.args ?? []) as readonly unknown[],
    value: input.value ?? 0n,
    chain: arcTestnet,
    account: walletClient.account!
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  return {
    hash,
    blockNumber: receipt.blockNumber.toString(),
    status: receipt.status
  };
}
