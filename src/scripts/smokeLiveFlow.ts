import crypto from "node:crypto";
import dotenv from "dotenv";
import { AddressInfo } from "node:net";

import app from "../app.js";
import { prisma, ensureSeedData } from "../db.js";
import { signWalletToken } from "../services/arc.js";
import { privateKeyToAccount } from "viem/accounts";

dotenv.config();

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

const smokeProofUrl =
  process.env.SMOKE_PROOF_URL ??
  "https://github.com/genlayerlabs/genlayer-docs/blob/main/pages/developers/intelligent-contracts/introduction.mdx";

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for the live smoke test.`);
  }

  return value;
}

function getAllowedDomains() {
  return (process.env.GENLAYER_ALLOWED_DOMAINS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
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

async function main() {
  requireEnv("ARC_RELAYER_PRIVATE_KEY");
  requireEnv("ARC_ESCROW_CONTRACT_ADDRESS");
  requireEnv("GENLAYER_RPC_URL");
  requireEnv("GENLAYER_VERIFIER_CONTRACT_ADDRESS");

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

    const job = await requestJson<{
      id: string;
      milestones: Array<{ id: string; status: string }>;
    }>(baseUrl, "/jobs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: `GenLayer Live Smoke ${suffix}`,
        description: "Tiny live smoke test that validates the full Arc and GenLayer verification path.",
        clientId: "client_1",
        workerId: "worker_1",
        categoryTags: ["smoke", "genlayer", "arc"],
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
      throw new Error("Smoke test job did not return a milestone id.");
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
        workerAddress: "0x1111111111111111111111111111111111111111"
      })
    });

    const submissionResponse = await requestJson<{
      verification: {
        verdict: string;
        source: string;
        confidence: number;
        reasons: string[];
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
        notes: "This smoke submission is intentionally narrow so the verifier can confirm the evidence directly from the linked documentation page."
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
          jobId: job.id,
          milestoneId,
          verification: submissionResponse.verification,
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