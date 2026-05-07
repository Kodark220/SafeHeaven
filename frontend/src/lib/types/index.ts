/**
 * Frontend types — aligned with the backend API shapes.
 * 
 * "Escrow" is kept as the UI‑facing term but the data shape
 * matches the backend's "Job" model.
 */

// ── Actor (backend: ActorProfile) ──────────────────────────

export type ActorType = "client" | "human" | "agent"

export interface Actor {
  id: string
  name: string
  walletAddress: string
  type: ActorType
  categories: string[]
  completedCount: number
  passRate: number
  onTimeRate: number
  disputeRate: number
  averageRating: number
  totalEarnedUsd: number
  trustScore?: number
}

/** @deprecated Use Actor instead */
export type Worker = Actor

// ── Milestone ──────────────────────────────────────────────

export type MilestoneStatus =
  | "pending"
  | "awaiting_submission"
  | "under_verification"
  | "needs_revision"
  | "approved"
  | "released"
  | "disputed"

export interface Milestone {
  id: string
  jobId: string
  title: string
  description: string
  amountUsd: number
  dueDate: string
  proofRequirements: string[]
  acceptanceCriteria: string[]
  status: MilestoneStatus
  sequence: number
  releasedAt?: string
  arcTxHash?: string
  /** Kept for backward compat with components that read `escrowId` */
  escrowId?: string
  /** Kept for backward compat */
  amount?: number
  order?: number
  submission?: any
  aiScore?: number
  clientReviewNotes?: string
  clientReviewedAt?: string | Date
  completedAt?: string | Date
  proofUrl?: string
}

// ── Submission ─────────────────────────────────────────────

export interface Submission {
  id: string
  jobId: string
  milestoneId: string
  submitterId: string
  summary: string
  proofLinks: string[]
  notes?: string
  submittedAt: string
}

/** @deprecated Submissions no longer use File[]. Use proofLinks. */
export interface MilestoneSubmission {
  files: File[]
  notes: string
  submittedAt: Date
}

// ── Verification ───────────────────────────────────────────

export type VerificationVerdict = "approved" | "needs_revision" | "rejected" | "uncertain"

/** @deprecated Use VerificationVerdict */
export type VerificationStatus = "pending" | "verified" | "failed" | "disputed"

export interface Verification {
  id: string
  jobId: string
  milestoneId: string
  submissionId: string
  verdict: VerificationVerdict
  confidence: number
  source: string
  reasons: string[]
  createdAt: string
  /** Compat aliases — some old components read these */
  escrowId?: string
  status?: VerificationStatus
  aiScore?: number
  humanReview?: boolean
  reviewedBy?: string
  reviewedAt?: Date | string
  notes?: string
}

// ── Escrow (maps to backend Job) ───────────────────────────

import type { EscrowStatus } from "@/lib/escrow"

export interface Escrow {
  id: string
  title: string
  description: string
  status: EscrowStatus
  totalAmountUsd: number
  createdAt: string
  fundedAt?: string
  clientId: string
  workerId: string
  categoryTags: string[]
  milestones: Milestone[]
  arcJobId?: string
  /** Compat aliases for old components */
  amount?: number
  currency?: "USD" | "ETH" | "USDC"
  updatedAt?: Date | string
  startDate?: Date | string
  endDate?: Date | string
  verifications?: Verification[]
  totalMilestonesCompleted?: number
  totalMilestones?: number
  disputeReason?: string
  disputeResolution?: string
  disputeInitiator?: string
  cancelledReason?: string
}

// ── Dashboard Stats ────────────────────────────────────────

export interface DashboardStats {
  totalEscrows: number
  activeEscrows: number
  completedEscrows: number
  totalValue: number
  milestonesCompleted: number
  totalMilestones: number
  averageVerificationScore: number
  activeWorkers: number
}

// ── Activity Log (frontend‑only, derived from jobs) ────────

export type ActivityType =
  | "escrow_created"
  | "escrow_funded"
  | "milestone_completed"
  | "verification_passed"
  | "funds_released"
  | "dispute_opened"
  | "dispute_resolved"

export interface Activity {
  id: string
  type: ActivityType
  escrowId: string
  title: string
  description: string
  actor: string
  timestamp: Date
  metadata?: Record<string, unknown>
}
