import { VerificationResult, VerificationVerdict } from "@prisma/client";

import { prisma } from "../db.js";
import { isGenLayerConfigured, verifyWithGenLayer, type GenLayerVerificationPayload } from "./genlayer.js";

const POSITIVE_SIGNALS = ["completed", "passed", "attached", "included", "delivered"];
const NEGATIVE_SIGNALS = ["missing", "blocked", "incomplete", "failed", "unclear"];
const EVIDENCE_EXCERPT_LIMIT = 4000;

type ProofEvidence = NonNullable<GenLayerVerificationPayload["proofEvidence"]>[number];

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(text: string) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function stripHtml(text: string) {
  return decodeHtmlEntities(
    text
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  );
}

function buildCandidateUrls(url: string) {
  const candidates = [url];

  try {
    const parsed = new URL(url);
    if (parsed.hostname === "github.com") {
      const match = parsed.pathname.match(/^\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/);
      if (match) {
        const [, owner, repo, ref, filePath] = match;
        candidates.unshift(`https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${filePath}`);
      }
    }
  } catch {
    return candidates;
  }

  return Array.from(new Set(candidates));
}

async function fetchProofEvidence(proofLinks: string[]): Promise<ProofEvidence[]> {
  const results = await Promise.all(
    proofLinks.slice(0, 3).map(async (proofLink) => {
      const candidateUrls = buildCandidateUrls(proofLink);
      let lastFailure = "Unable to fetch proof content.";

      for (const candidateUrl of candidateUrls) {
        try {
          const response = await fetch(candidateUrl, {
            headers: {
              accept: "text/plain,text/html,application/json;q=0.9,*/*;q=0.5",
              "user-agent": "arc-verified-escrow-smoke/1.0"
            }
          });

          if (!response.ok) {
            lastFailure = `Fetch returned ${response.status} for ${candidateUrl}.`;
            continue;
          }

          const contentType = response.headers.get("content-type");
          const rawBody = await response.text();
          const normalizedBody = normalizeWhitespace(
            contentType?.includes("html") ? stripHtml(rawBody) : decodeHtmlEntities(rawBody)
          );

          if (!normalizedBody) {
            lastFailure = `Fetched ${candidateUrl} but the response body was empty after sanitization.`;
            continue;
          }

          return {
            url: proofLink,
            fetchedUrl: candidateUrl,
            contentType,
            excerpt: normalizedBody.slice(0, EVIDENCE_EXCERPT_LIMIT),
            status: "fetched" as const
          };
        } catch (error) {
          lastFailure = error instanceof Error ? error.message : "Unknown fetch error.";
        }
      }

      return {
        url: proofLink,
        excerpt: lastFailure,
        status: "failed" as const
      };
    })
  );

  return results;
}

function inferVerdict(text: string): { verdict: VerificationVerdict; confidence: number; reasons: string[] } {
  const normalized = text.toLowerCase();
  const positiveHits = POSITIVE_SIGNALS.filter((signal) => normalized.includes(signal)).length;
  const negativeHits = NEGATIVE_SIGNALS.filter((signal) => normalized.includes(signal)).length;

  if (negativeHits > positiveHits) {
    return {
      verdict: "needs_revision",
      confidence: 0.78,
      reasons: ["Submission text includes missing or incomplete indicators."]
    };
  }

  if (positiveHits >= 2) {
    return {
      verdict: "approved",
      confidence: 0.9,
      reasons: ["Submission includes enough positive completion signals for auto-approval."]
    };
  }

  return {
    verdict: "uncertain",
    confidence: 0.55,
    reasons: ["Verification needs manual review because the submission is ambiguous."]
  };
}

export async function verifySubmission(submissionId: string): Promise<VerificationResult> {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      milestone: true,
      job: true
    }
  });

  if (!submission) {
    throw new Error("Submission not found for verification.");
  }

  let verdictData:
    | {
        verdict: VerificationVerdict;
        confidence: number;
        reasons: string[];
        source: string;
        rawResult?: unknown;
        externalRef?: string;
      }
    | undefined;

  if (isGenLayerConfigured()) {
    const proofEvidence = await fetchProofEvidence(submission.proofLinks);
    const payload: GenLayerVerificationPayload = {
      jobId: submission.jobId,
      milestoneId: submission.milestoneId,
      title: submission.job.title,
      description: submission.milestone.description,
      acceptanceCriteria: submission.milestone.acceptanceCriteria,
      proofRequirements: submission.milestone.proofRequirements,
      submissionSummary: submission.summary,
      proofLinks: submission.proofLinks,
      proofEvidence,
      notes: submission.notes
    };

    try {
      const genLayerResult = await verifyWithGenLayer(payload);
      verdictData = {
        verdict: genLayerResult.verdict,
        confidence: genLayerResult.confidence,
        reasons: genLayerResult.reasons,
        source: "genlayer",
        rawResult: genLayerResult.rawResult,
        externalRef: genLayerResult.externalRef
      };
    } catch (error) {
      console.warn("GenLayer verification failed, falling back to local heuristic.", error);
    }
  }

  if (!verdictData) {
    const fallback = inferVerdict([submission.summary, submission.notes ?? "", ...submission.proofLinks].join(" "));
    verdictData = {
      ...fallback,
      source: "mock"
    };
  }

  return prisma.verificationResult.create({
    data: {
      id: `ver_${crypto.randomUUID()}`,
      jobId: submission.jobId,
      milestoneId: submission.milestoneId,
      submissionId: submission.id,
      verdict: verdictData.verdict,
      confidence: verdictData.confidence,
      reasons: verdictData.reasons,
      source: verdictData.source,
      externalRef: verdictData.externalRef,
      rawResult: verdictData.rawResult as object | undefined
    }
  });
}
