/**
 * AI Verification — now delegated to the backend.
 *
 * The backend runs GenLayer‑based verification when a submission
 * is posted to POST /jobs/:jobId/milestones/:milestoneId/submissions.
 *
 * This module is kept for backward‑compat with components that
 * import from "@/lib/escrow/ai-verification".
 */

import type { Milestone } from "@/lib/types"

export interface AiVerificationResult {
  aiScore: number
  status: "passed" | "failed"
  reason?: string
}

/**
 * Run AI verification on a milestone submission.
 *
 * In production this is handled server‑side. This stub returns
 * a result based on whether the milestone is already approved.
 */
export function runAiVerification(milestone: Milestone): AiVerificationResult {
  // Backend handles real verification — this is a client-side stub
  if (milestone.status === "approved" || milestone.status === "released") {
    return { aiScore: 0.95, status: "passed" }
  }

  if (milestone.status === "needs_revision") {
    return { aiScore: 0.4, status: "failed", reason: "Milestone needs revision" }
  }

  return { aiScore: 0.8, status: "passed" }
}

/**
 * Check if all milestones in an escrow are approved
 */
export function areAllMilestonesApproved(milestones: Milestone[]): boolean {
  if (milestones.length === 0) return false
  return milestones.every(m => m.status === "approved" || m.status === "released")
}
