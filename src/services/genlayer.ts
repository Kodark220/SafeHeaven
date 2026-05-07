import { abi } from "genlayer-js";
import { fromHex } from "viem";

type PayloadMode = "json-string" | "object" | "positional";
type CalldataArgs = unknown[];

export interface GenLayerVerificationPayload {
  jobId: string;
  milestoneId: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  proofRequirements: string[];
  submissionSummary: string;
  proofLinks: string[];
  proofEvidence?: Array<{
    url: string;
    fetchedUrl?: string;
    contentType?: string | null;
    excerpt: string;
    status: "fetched" | "fallback" | "failed";
  }>;
  notes?: string | null;
}

export interface GenLayerVerificationOutcome {
  verdict: "approved" | "needs_revision" | "rejected" | "uncertain";
  confidence: number;
  reasons: string[];
  rawResult: unknown;
  externalRef?: string;
}

function getGenLayerRpcUrl() {
  return process.env.GENLAYER_RPC_URL ?? "";
}

function getStudioRpcUrl() {
  return process.env.GENLAYER_STUDIO_RPC_URL ?? "";
}

function getStudioContractAddress() {
  return process.env.GENLAYER_STUDIO_CONTRACT_ADDRESS ?? "";
}

async function requestGenLayerRpc<T>(method: string, params: unknown[], rpcUrl?: string): Promise<T> {
  const url = rpcUrl ?? getGenLayerRpcUrl();

  if (!url) {
    throw new Error("GenLayer RPC URL is not configured.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method,
        params
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`GenLayer RPC request failed with status ${response.status}.`);
    }

    const payload = (await response.json()) as { result?: T; error?: { message?: string } };

    if (payload.error) {
      throw new Error(payload.error.message ?? "GenLayer RPC returned an error.");
    }

    return payload.result as T;
  } finally {
    clearTimeout(timeout);
  }
}

function makeCalldataObject(functionName: string, args: unknown[]) {
  const data: Record<string, unknown> = { method: functionName };

  if (args.length > 0) {
    data.args = args;
  }

  return data;
}

function extractGenCallResult(result: unknown) {
  if (typeof result === "string") {
    return `0x${result}`;
  }

  if (result && typeof result === "object" && "data" in result) {
    const record = result as { data?: string; status?: { code?: number; message?: string } };

    if (record.status && record.status.code !== 0) {
      throw new Error(record.status.message ?? "gen_call failed.");
    }

    if (typeof record.data === "string") {
      return `0x${record.data}`;
    }
  }

  throw new Error(`Unexpected gen_call response: ${JSON.stringify(result)}`);
}

function toPlainJson(value: unknown): unknown {
  if (value instanceof Map) {
    return Object.fromEntries(Array.from(value.entries(), ([key, nested]) => [String(key), toPlainJson(nested)]));
  }

  if (Array.isArray(value)) {
    return value.map((entry) => toPlainJson(entry));
  }

  return value;
}

function buildArgs(payload: GenLayerVerificationPayload): CalldataArgs {
  const mode = (process.env.GENLAYER_VERIFIER_PAYLOAD_MODE ?? "json-string") as PayloadMode;

  if (mode === "object") {
    return [payload as unknown as CalldataArgs[number]] as CalldataArgs;
  }

  if (mode === "positional") {
    return [
      payload.title,
      payload.description,
      payload.acceptanceCriteria,
      payload.proofRequirements,
      payload.submissionSummary,
      payload.proofLinks,
      payload.notes ?? ""
    ] as CalldataArgs;
  }

  return [JSON.stringify(payload)] as CalldataArgs;
}

function normalizeVerificationResult(result: unknown): GenLayerVerificationOutcome {
  if (typeof result === "boolean") {
    return {
      verdict: result ? "approved" : "rejected",
      confidence: result ? 0.95 : 0.8,
      reasons: [result ? "GenLayer verifier returned true." : "GenLayer verifier returned false."],
      rawResult: result
    };
  }

  if (typeof result === "string") {
    try {
      const parsed = JSON.parse(result) as Record<string, unknown>;
      return normalizeVerificationResult(parsed);
    } catch {
      return {
        verdict: "uncertain",
        confidence: 0.5,
        reasons: [result],
        rawResult: result
      };
    }
  }

  if (result && typeof result === "object") {
    const record = result as Record<string, unknown>;
    const verdict = record.verdict;
    const confidence = Number(record.confidence ?? 0.5);
    const reasons = Array.isArray(record.reasons) ? record.reasons.map(String) : [String(record.reason ?? "No reason returned.")];

    if (
      verdict === "approved" ||
      verdict === "needs_revision" ||
      verdict === "rejected" ||
      verdict === "uncertain"
    ) {
      return {
        verdict,
        confidence: Number.isFinite(confidence) ? confidence : 0.5,
        reasons,
        rawResult: result,
        externalRef: typeof record.txId === "string" ? record.txId : undefined
      };
    }
  }

  return {
    verdict: "uncertain",
    confidence: 0.5,
    reasons: ["GenLayer returned an unrecognized result shape."],
    rawResult: result
  };
}

export function isGenLayerConfigured(): boolean {
  const hasBradbury = Boolean(process.env.GENLAYER_VERIFIER_CONTRACT_ADDRESS && process.env.GENLAYER_RPC_URL);
  const hasStudio = Boolean(getStudioRpcUrl() && getStudioContractAddress());
  return hasBradbury || hasStudio;
}

async function callGenLayerVerifier(
  payload: GenLayerVerificationPayload,
  rpcUrl: string,
  contractAddress: string
): Promise<GenLayerVerificationOutcome> {
  const functionName = process.env.GENLAYER_VERIFIER_FUNCTION_NAME ?? "verify_submission";
  const encodedData = [
    abi.calldata.encode(makeCalldataObject(functionName, buildArgs(payload)) as unknown as Parameters<typeof abi.calldata.encode>[0]),
    false
  ];
  const serializedData = abi.transactions.serialize(encodedData);
  const senderAddress = process.env.GENLAYER_ACCOUNT_ADDRESS ?? "0x0000000000000000000000000000000000000000";

  const rawResult = await requestGenLayerRpc<unknown>("gen_call", [
    {
      type: "read",
      to: contractAddress,
      from: senderAddress,
      data: serializedData,
      transaction_hash_variant: "latest-nonfinal"
    }
  ], rpcUrl);

  const prefixedResult = extractGenCallResult(rawResult);
  const result = toPlainJson(abi.calldata.decode(fromHex(prefixedResult, "bytes")));

  return normalizeVerificationResult(result);
}

export async function verifyWithGenLayer(payload: GenLayerVerificationPayload): Promise<GenLayerVerificationOutcome> {
  if (!isGenLayerConfigured()) {
    throw new Error("GenLayer verifier is not configured (neither Bradbury nor Studio).");
  }

  const bradburyUrl = getGenLayerRpcUrl();
  const bradburyContract = process.env.GENLAYER_VERIFIER_CONTRACT_ADDRESS ?? "";
  const studioUrl = getStudioRpcUrl();
  const studioContract = getStudioContractAddress();

  // Try Bradbury first
  if (bradburyUrl && bradburyContract) {
    try {
      console.log("[GenLayer] Attempting Bradbury testnet...");
      const result = await callGenLayerVerifier(payload, bradburyUrl, bradburyContract);
      console.log(`[GenLayer] Bradbury returned verdict: ${result.verdict}`);
      return result;
    } catch (error) {
      console.warn("[GenLayer] Bradbury failed, checking Studio fallback...", error instanceof Error ? error.message : error);
    }
  }

  // Fallback to Studio
  if (studioUrl && studioContract) {
    try {
      console.log("[GenLayer] Falling back to Studio simulator...");
      const result = await callGenLayerVerifier(payload, studioUrl, studioContract);
      console.log(`[GenLayer] Studio returned verdict: ${result.verdict}`);
      return result;
    } catch (studioError) {
      console.error("[GenLayer] Studio fallback also failed.", studioError instanceof Error ? studioError.message : studioError);
      throw studioError;
    }
  }

  throw new Error("All GenLayer endpoints exhausted (Bradbury down, Studio not configured).");
}

export async function getGenLayerTransactionStatus(txId: `0x${string}`) {
  return requestGenLayerRpc("gen_getTransactionStatus", [{ txId }]);
}

export async function getGenLayerTransactionReceipt(txId: `0x${string}`) {
  return requestGenLayerRpc("gen_getTransactionReceipt", [{ txId }]);
}
