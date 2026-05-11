import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { z } from "zod";

import { arcEscrowAbi, toEscrowKey, usdNumberToArcUnits } from "./contracts/arcEscrow.js";
import { getIntegrationStatus } from "./integrations.js";
import { prisma } from "./db.js";
import { requireAuth, type AuthenticatedRequest } from "./services/auth.js";
import {
  buildWalletMessage,
  executeArcContractWrite,
  getArcNetworkState,
  getArcWalletState,
  readArcContractState,
  signWalletToken,
  verifyWalletChallenge
} from "./services/arc.js";
import { getGenLayerTransactionReceipt, getGenLayerTransactionStatus } from "./services/genlayer.js";
import { getNanopaymentDetails, getNanopaymentPreviewPrice, isNanopaymentsConfigured, requireNanopayment } from "./services/nanopayments.js";
import { getReputationSnapshot } from "./services/reputation.js";
import { verifySubmission } from "./services/verification.js";
import { serializeActor, serializeJob, serializeMilestone, serializeNanopayment, serializeSubmission, serializeVerification } from "./serializers.js";

dotenv.config();

const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [
    'https://safe-heaven-sable.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
  ],
  credentials: true
}));
app.use(express.json());

function serializeBigIntsDeep(value: unknown): unknown {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((entry) => serializeBigIntsDeep(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, serializeBigIntsDeep(entry)])
    );
  }

  return value;
}

const milestoneSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  amountUsd: z.number().positive(),
  dueDate: z.string().datetime(),
  proofRequirements: z.array(z.string()).min(1),
  acceptanceCriteria: z.array(z.string()).min(1)
});

const createJobSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  clientId: z.string().min(1),
  workerId: z.string().min(1),
  categoryTags: z.array(z.string()).default([]),
  milestones: z.array(milestoneSchema).min(1)
});

const acceptJobSchema = z.object({
  workerId: z.string().min(1)
});

const createSubmissionSchema = z.object({
  summary: z.string().min(10),
  proofLinks: z.array(z.string().url()).min(1),
  notes: z.string().optional(),
  submitterId: z.string().min(1)
});

const walletChallengeSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  chainId: z.number().int().positive().default(Number(process.env.ARC_CHAIN_ID ?? 5042002))
});

const walletVerifySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  nonce: z.string().min(8),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/)
});

const arcContractSchema = z.object({
  contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  abi: z.array(z.union([z.string(), z.record(z.any())])),
  functionName: z.string().min(1),
  args: z.array(z.any()).optional(),
  value: z.string().optional()
});

const releaseSchema = z.object({
  arcSync: arcContractSchema.extend({
    jobId: z.string().optional()
  }).optional()
});

const premiumPreviewSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  acceptanceCriteria: z.array(z.string()).min(1),
  proofRequirements: z.array(z.string()).min(1),
  summary: z.string().min(10),
  proofLinks: z.array(z.string().url()).min(1),
  notes: z.string().optional(),
  jobId: z.string().min(1).optional(),
  milestoneId: z.string().min(1).optional(),
  submissionId: z.string().min(1).optional()
});

const arcEscrowFundSchema = z.object({
  clientAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  workerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  milestoneAmounts: z.array(z.string().regex(/^\d+$/)).optional()
});

app.get("/health", (_request, response) => {
  response.json({ status: "ok", service: "arc-verified-escrow-backend", integrations: getIntegrationStatus() });
});

app.get("/integrations", (_request, response) => {
  response.json(getIntegrationStatus());
});

app.get("/nanopayments", (_request, response) => {
  response.json({
    configured: isNanopaymentsConfigured(),
    previewPrice: getNanopaymentPreviewPrice(),
    sellerAddress: process.env.NANOPAYMENTS_SELLER_ADDRESS ?? null,
    networks: (process.env.NANOPAYMENTS_NETWORKS ?? "eip155:5042002")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    facilitatorUrl: process.env.NANOPAYMENTS_FACILITATOR_URL ?? "https://gateway-api-testnet.circle.com"
  });
});

app.get("/nanopayments/audits", async (request, response) => {
  const jobId = typeof request.query.jobId === "string" ? request.query.jobId : undefined;
  const milestoneId = typeof request.query.milestoneId === "string" ? request.query.milestoneId : undefined;
  const submissionId = typeof request.query.submissionId === "string" ? request.query.submissionId : undefined;

  const audits = await prisma.nanopaymentEvent.findMany({
    where: {
      ...(jobId ? { jobId } : {}),
      ...(milestoneId ? { milestoneId } : {}),
      ...(submissionId ? { submissionId } : {})
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  response.json(audits.map(serializeNanopayment));
});

app.post("/wallet/challenge", async (request, response) => {
  const parsed = walletChallengeSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ message: "Invalid wallet challenge payload.", issues: parsed.error.flatten() });
    return;
  }

  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + 10 * 60 * 1000);
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const message = buildWalletMessage({
    address: parsed.data.address,
    nonce,
    chainId: parsed.data.chainId,
    issuedAt: issuedAt.toISOString()
  });

  await prisma.walletChallenge.create({
    data: {
      id: `wch_${crypto.randomUUID()}`,
      address: parsed.data.address.toLowerCase(),
      chainId: parsed.data.chainId,
      nonce,
      message,
      expiresAt
    }
  });

  response.status(201).json({ nonce, message, expiresAt: expiresAt.toISOString() });
});

app.post("/wallet/verify", async (request, response) => {
  const parsed = walletVerifySchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ message: "Invalid wallet verification payload.", issues: parsed.error.flatten() });
    return;
  }

  const challenge = await prisma.walletChallenge.findFirst({
    where: {
      address: parsed.data.address.toLowerCase(),
      nonce: parsed.data.nonce,
      consumedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { issuedAt: "desc" }
  });

  if (!challenge) {
    response.status(404).json({ message: "Wallet challenge not found or expired." });
    return;
  }

  const verified = await verifyWalletChallenge({
    address: parsed.data.address as `0x${string}`,
    message: challenge.message,
    signature: parsed.data.signature as `0x${string}`
  });

  if (!verified) {
    response.status(401).json({ message: "Signature verification failed." });
    return;
  }

  await prisma.walletChallenge.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() }
  });

  const actor = await prisma.actorProfile.findFirst({ where: { walletAddress: parsed.data.address } });
  const token = signWalletToken({
    address: parsed.data.address,
    chainId: challenge.chainId,
    actorId: actor?.id ?? null
  });

  response.json({ token, actor: actor ? serializeActor(actor) : null });
});

app.get("/wallet/me", requireAuth, async (request: AuthenticatedRequest, response) => {
  const actor = await prisma.actorProfile.findFirst({ where: { walletAddress: request.auth?.address } });
  response.json({ auth: request.auth, actor: actor ? serializeActor(actor) : null });
});

app.get("/arc/network", async (_request, response) => {
  response.json(await getArcNetworkState());
});

app.get("/arc/wallets/:address", async (request, response) => {
  response.json(await getArcWalletState(request.params.address as `0x${string}`));
});

app.post("/premium/verification-preview", requireNanopayment(getNanopaymentPreviewPrice()), async (request, response) => {
  const parsed = premiumPreviewSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ message: "Invalid premium preview payload.", issues: parsed.error.flatten() });
    return;
  }

  const combinedText = [
    parsed.data.title,
    parsed.data.description,
    parsed.data.summary,
    ...(parsed.data.notes ? [parsed.data.notes] : []),
    ...parsed.data.acceptanceCriteria,
    ...parsed.data.proofRequirements,
    ...parsed.data.proofLinks
  ].join("\n");

  const positiveSignals = ["completed", "passed", "attached", "included", "delivered"].filter((signal) =>
    combinedText.toLowerCase().includes(signal)
  );
  const negativeSignals = ["missing", "blocked", "incomplete", "failed", "unclear"].filter((signal) =>
    combinedText.toLowerCase().includes(signal)
  );
  const paymentDetails = getNanopaymentDetails(request as Parameters<typeof getNanopaymentDetails>[0]);

  if (paymentDetails?.verified) {
    if (parsed.data.jobId) {
      const job = await prisma.job.findUnique({ where: { id: parsed.data.jobId } });
      if (!job) {
        response.status(400).json({ message: "Premium preview job context was not found." });
        return;
      }
    }

    if (parsed.data.milestoneId) {
      const milestone = await prisma.milestone.findUnique({ where: { id: parsed.data.milestoneId } });
      if (!milestone) {
        response.status(400).json({ message: "Premium preview milestone context was not found." });
        return;
      }
    }

    if (parsed.data.submissionId) {
      const submission = await prisma.submission.findUnique({ where: { id: parsed.data.submissionId } });
      if (!submission) {
        response.status(400).json({ message: "Premium preview submission context was not found." });
        return;
      }
    }

    await prisma.nanopaymentEvent.create({
      data: {
        id: `npe_${crypto.randomUUID()}`,
        kind: "verification_preview",
        jobId: parsed.data.jobId,
        milestoneId: parsed.data.milestoneId,
        submissionId: parsed.data.submissionId,
        payerAddress: paymentDetails.payer,
        sellerAddress: process.env.NANOPAYMENTS_SELLER_ADDRESS ?? null,
        network: paymentDetails.network,
        amount: paymentDetails.amount,
        transactionRef: paymentDetails.transaction,
        metadata: {
          title: parsed.data.title,
          likelyOutcome:
            negativeSignals.length > positiveSignals.length
              ? "needs_revision"
              : positiveSignals.length >= 2
                ? "approved"
                : "uncertain"
        }
      }
    });
  }

  response.json({
    paid: Boolean(paymentDetails?.verified),
    payment: paymentDetails,
    preview: {
      signalSummary: {
        positiveSignals,
        negativeSignals
      },
      likelyOutcome:
        negativeSignals.length > positiveSignals.length
          ? "needs_revision"
          : positiveSignals.length >= 2
            ? "approved"
            : "uncertain",
      recommendation:
        positiveSignals.length >= 2
          ? "Submission looks strong enough to send through the full verification pipeline."
          : "Submission would benefit from stronger evidence or clearer completion language before final verification."
    }
  });
});

app.post("/arc/contracts/read", async (request, response) => {
  const parsed = arcContractSchema.omit({ value: true }).safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ message: "Invalid Arc read payload.", issues: parsed.error.flatten() });
    return;
  }

  response.json({
    result: serializeBigIntsDeep(
      await readArcContractState({
      contractAddress: parsed.data.contractAddress as `0x${string}`,
      abi: parsed.data.abi,
      functionName: parsed.data.functionName,
      args: parsed.data.args
      })
    )
  });
});

app.post("/arc/contracts/write", requireAuth, async (request: AuthenticatedRequest, response) => {
  const parsed = arcContractSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ message: "Invalid Arc write payload.", issues: parsed.error.flatten() });
    return;
  }

  const result = await executeArcContractWrite({
    contractAddress: parsed.data.contractAddress as `0x${string}`,
    abi: parsed.data.abi,
    functionName: parsed.data.functionName,
    args: parsed.data.args,
    value: parsed.data.value ? BigInt(parsed.data.value) : undefined
  });

  response.json({ requestedBy: request.auth?.address ?? null, transaction: result });
});

app.get("/genlayer/transactions/:txId/status", async (request, response) => {
  response.json(await getGenLayerTransactionStatus(request.params.txId as `0x${string}`));
});

app.get("/genlayer/transactions/:txId/receipt", async (request, response) => {
  response.json(await getGenLayerTransactionReceipt(request.params.txId as `0x${string}`));
});

app.get("/actors", async (_request, response) => {
  const actors = await prisma.actorProfile.findMany({ orderBy: { name: "asc" } });
  const withScores = await Promise.all(
    actors.map(async (actor) => ({
      ...serializeActor(actor),
      trustScore: (await getReputationSnapshot(actor.id))?.trustScore ?? 0
    }))
  );

  response.json(withScores);
});

app.get("/actors/:actorId", async (request, response) => {
  const reputation = await getReputationSnapshot(request.params.actorId);

  if (!reputation) {
    response.status(404).json({ message: "Actor not found." });
    return;
  }

  response.json(reputation);
});

app.get("/jobs", async (_request, response) => {
  const jobs = await prisma.job.findMany({ include: { milestones: { orderBy: { sequence: "asc" } } } });
  response.json(jobs.map(serializeJob));
});

app.post("/jobs", async (request, response) => {
  const parsed = createJobSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ message: "Invalid job payload.", issues: parsed.error.flatten() });
    return;
  }

  const totalAmountUsd = parsed.data.milestones.reduce((sum, milestone) => sum + milestone.amountUsd, 0);

  const job = await prisma.job.create({
    data: {
      id: `job_${crypto.randomUUID()}`,
      title: parsed.data.title,
      description: parsed.data.description,
      status: "funded",
      totalAmountUsd,
      fundedAt: new Date(),
      clientId: parsed.data.clientId,
      workerId: parsed.data.workerId,
      categoryTags: parsed.data.categoryTags,
      milestones: {
        create: parsed.data.milestones.map((milestone, index) => ({
          id: `mil_${crypto.randomUUID()}`,
          title: milestone.title,
          description: milestone.description,
          amountUsd: milestone.amountUsd,
          dueDate: new Date(milestone.dueDate),
          proofRequirements: milestone.proofRequirements,
          acceptanceCriteria: milestone.acceptanceCriteria,
          status: "awaiting_submission",
          sequence: index
        }))
      }
    },
    include: { milestones: { orderBy: { sequence: "asc" } } }
  });

  response.status(201).json(serializeJob(job));
});

app.get("/jobs/:jobId", async (request, response) => {
  const job = await prisma.job.findUnique({
    where: { id: request.params.jobId },
    include: { milestones: { orderBy: { sequence: "asc" } } }
  });

  if (!job) {
    response.status(404).json({ message: "Job not found." });
    return;
  }

  response.json(serializeJob(job));
});

app.post("/jobs/:jobId/accept", async (request, response) => {
  const parsed = acceptJobSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ message: "Invalid accept job payload.", issues: parsed.error.flatten() });
    return;
  }

  const job = await prisma.job.findUnique({
    where: { id: request.params.jobId },
    include: { milestones: { orderBy: { sequence: "asc" } } }
  });

  if (!job) {
    response.status(404).json({ message: "Job not found." });
    return;
  }

  if (job.workerId !== parsed.data.workerId) {
    response.status(403).json({ message: "Only the assigned worker can accept this job." });
    return;
  }

  if (job.status === "completed" || job.status === "disputed") {
    response.status(409).json({ message: `Job cannot be accepted while status is ${job.status}.` });
    return;
  }

  if (job.status === "in_progress") {
    response.json({ accepted: true, job: serializeJob(job) });
    return;
  }

  const acceptedJob = await prisma.job.update({
    where: { id: job.id },
    data: { status: "in_progress" },
    include: { milestones: { orderBy: { sequence: "asc" } } }
  });

  response.json({ accepted: true, job: serializeJob(acceptedJob) });
});

app.post("/jobs/:jobId/arc/fund", requireAuth, async (request: AuthenticatedRequest, response) => {
  if (!process.env.ARC_ESCROW_CONTRACT_ADDRESS) {
    response.status(400).json({ message: "ARC_ESCROW_CONTRACT_ADDRESS is not configured." });
    return;
  }

  const jobId = Array.isArray(request.params.jobId) ? request.params.jobId[0] : request.params.jobId;
  if (!jobId) {
    response.status(400).json({ message: "Job id is required." });
    return;
  }

  const parsed = arcEscrowFundSchema.safeParse(request.body ?? {});
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid Arc escrow funding payload.", issues: parsed.error.flatten() });
    return;
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { milestones: { orderBy: { sequence: "asc" } } }
  });

  if (!job) {
    response.status(404).json({ message: "Job not found." });
    return;
  }

  if (job.arcJobId) {
    response.status(409).json({ message: "Job is already funded on Arc.", arcJobId: job.arcJobId });
    return;
  }

  const milestoneKeys = job.milestones.map((milestone) => toEscrowKey(milestone.id));
  const milestoneAmounts: bigint[] = parsed.data.milestoneAmounts
    ? parsed.data.milestoneAmounts.map((amount) => BigInt(amount))
    : job.milestones.map((milestone) => usdNumberToArcUnits(milestone.amountUsd));

  if (milestoneAmounts.length !== job.milestones.length) {
    response.status(400).json({ message: "milestoneAmounts length must match the number of job milestones." });
    return;
  }

  const totalValue = milestoneAmounts.reduce<bigint>((sum, amount) => sum + amount, 0n);
  const arcJobId = toEscrowKey(job.id);

  const transaction = await executeArcContractWrite({
    contractAddress: process.env.ARC_ESCROW_CONTRACT_ADDRESS as `0x${string}`,
    abi: arcEscrowAbi as unknown as unknown[],
    functionName: "createJob",
    args: [arcJobId, parsed.data.clientAddress, parsed.data.workerAddress, milestoneKeys, milestoneAmounts],
    value: totalValue
  });

  await prisma.job.update({
    where: { id: job.id },
    data: { arcJobId }
  });

  response.json({
    requestedBy: request.auth?.address ?? null,
    arcJobId,
    milestoneKeys,
    totalValue: totalValue.toString(),
    transaction
  });
});

app.get("/jobs/:jobId/arc", async (request, response) => {
  if (!process.env.ARC_ESCROW_CONTRACT_ADDRESS) {
    response.status(400).json({ message: "ARC_ESCROW_CONTRACT_ADDRESS is not configured." });
    return;
  }

  const job = await prisma.job.findUnique({
    where: { id: request.params.jobId },
    include: { milestones: { orderBy: { sequence: "asc" } } }
  });

  if (!job) {
    response.status(404).json({ message: "Job not found." });
    return;
  }

  const arcJobId = job.arcJobId ?? toEscrowKey(job.id);
  const onchainJob = await readArcContractState({
    contractAddress: process.env.ARC_ESCROW_CONTRACT_ADDRESS as `0x${string}`,
    abi: arcEscrowAbi as unknown as unknown[],
    functionName: "getJob",
    args: [arcJobId]
  });

  const milestones = await Promise.all(
    job.milestones.map(async (milestone) => ({
      milestoneId: milestone.id,
      milestoneKey: toEscrowKey(milestone.id),
      onchain: await readArcContractState({
        contractAddress: process.env.ARC_ESCROW_CONTRACT_ADDRESS as `0x${string}`,
        abi: arcEscrowAbi as unknown as unknown[],
        functionName: "getMilestone",
        args: [arcJobId, toEscrowKey(milestone.id)]
      })
    }))
  );

  response.json(serializeBigIntsDeep({ arcJobId, onchainJob, milestones }));
});

app.post("/jobs/:jobId/milestones/:milestoneId/submissions", async (request, response) => {
  const parsed = createSubmissionSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ message: "Invalid submission payload.", issues: parsed.error.flatten() });
    return;
  }

  const milestone = await prisma.milestone.findFirst({
    where: {
      id: request.params.milestoneId,
      jobId: request.params.jobId
    }
  });

  if (!milestone) {
    response.status(404).json({ message: "Milestone not found." });
    return;
  }

  const submission = await prisma.submission.create({
    data: {
      id: `sub_${crypto.randomUUID()}`,
      jobId: request.params.jobId,
      milestoneId: milestone.id,
      submitterId: parsed.data.submitterId,
      summary: parsed.data.summary,
      proofLinks: parsed.data.proofLinks,
      notes: parsed.data.notes
    }
  });

  await prisma.milestone.update({
    where: { id: milestone.id },
    data: { status: "under_verification" }
  });

  const verification = await verifySubmission(submission.id);

  if (verification.verdict === "approved") {
    await prisma.milestone.update({ where: { id: milestone.id }, data: { status: "approved" } });
  } else if (verification.verdict === "needs_revision" || verification.verdict === "rejected") {
    await prisma.milestone.update({ where: { id: milestone.id }, data: { status: "needs_revision" } });
  } else {
    await prisma.milestone.update({ where: { id: milestone.id }, data: { status: "disputed" } });
  }

  const updatedMilestone = await prisma.milestone.findUnique({ where: { id: milestone.id } });
  response.status(201).json({
    submission: serializeSubmission(submission),
    verification: serializeVerification(verification),
    milestone: updatedMilestone ? serializeMilestone(updatedMilestone) : null
  });
});

app.post("/jobs/:jobId/milestones/:milestoneId/release", async (request, response) => {
  const parsedBody = releaseSchema.safeParse(request.body ?? {});

  if (!parsedBody.success) {
    response.status(400).json({ message: "Invalid release payload.", issues: parsedBody.error.flatten() });
    return;
  }

  const job = await prisma.job.findUnique({
    where: { id: request.params.jobId },
    include: { milestones: true }
  });

  if (!job) {
    response.status(404).json({ message: "Job not found." });
    return;
  }

  const milestone = job.milestones.find((entry) => entry.id === request.params.milestoneId);

  if (!milestone) {
    response.status(404).json({ message: "Milestone not found." });
    return;
  }

  if (milestone.status !== "approved") {
    response.status(409).json({ message: "Milestone must be approved before release." });
    return;
  }

  const arcSyncResult = parsedBody.data.arcSync
    ? await executeArcContractWrite({
        contractAddress: parsedBody.data.arcSync.contractAddress as `0x${string}`,
        abi: parsedBody.data.arcSync.abi,
        functionName: parsedBody.data.arcSync.functionName,
        args: parsedBody.data.arcSync.args,
        value: parsedBody.data.arcSync.value ? BigInt(parsedBody.data.arcSync.value) : undefined
      })
    : process.env.ARC_ESCROW_CONTRACT_ADDRESS && job.arcJobId
      ? await executeArcContractWrite({
          contractAddress: process.env.ARC_ESCROW_CONTRACT_ADDRESS as `0x${string}`,
          abi: arcEscrowAbi as unknown as unknown[],
          functionName: "releaseMilestone",
          args: [job.arcJobId, toEscrowKey(milestone.id)]
        })
      : null;

  const releasedMilestone = await prisma.milestone.update({
    where: { id: milestone.id },
    data: {
      status: "released",
      releasedAt: new Date(),
      arcTxHash: arcSyncResult?.hash
    }
  });

  const remaining = job.milestones.filter(
    (entry) => entry.id !== milestone.id && entry.status !== "released"
  ).length;
  if (remaining === 0) {
    await prisma.job.update({ where: { id: job.id }, data: { status: "completed" } });
  }

  const updatedJob = await prisma.job.findUnique({
    where: { id: job.id },
    include: { milestones: { orderBy: { sequence: "asc" } } }
  });

  response.json({
    job: updatedJob ? serializeJob(updatedJob) : null,
    milestone: serializeMilestone(releasedMilestone),
    payoutStatus: "released",
    arcSync: arcSyncResult
  });
});

app.get("/verifications", async (_request, response) => {
  const verifications = await prisma.verificationResult.findMany({ orderBy: { createdAt: "desc" } });
  response.json(verifications.map(serializeVerification));
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error(error);
  response.status(500).json({ message: "Internal server error." });
});

export default app;
