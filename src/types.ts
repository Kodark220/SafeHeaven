export type ActorType = "client" | "human";

export type JobStatus = "draft" | "funded" | "in_progress" | "completed" | "disputed";
export type MilestoneStatus =
  | "pending"
  | "awaiting_submission"
  | "under_verification"
  | "needs_revision"
  | "approved"
  | "released"
  | "disputed";

export type VerificationVerdict = "approved" | "needs_revision" | "rejected" | "uncertain";

export interface ActorProfile {
  id: string;
  name: string;
  walletAddress: string;
  type: ActorType;
  categories: string[];
  completedCount: number;
  passRate: number;
  onTimeRate: number;
  disputeRate: number;
  averageRating: number;
  totalEarnedUsd: number;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  amountUsd: number;
  dueDate: string;
  proofRequirements: string[];
  acceptanceCriteria: string[];
  status: MilestoneStatus;
  submissionId?: string;
  verificationId?: string;
  releasedAt?: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  status: JobStatus;
  totalAmountUsd: number;
  createdAt: string;
  fundedAt?: string;
  clientId: string;
  workerId: string;
  categoryTags: string[];
  milestones: Milestone[];
}

export interface Submission {
  id: string;
  jobId: string;
  milestoneId: string;
  submitterId: string;
  summary: string;
  proofLinks: string[];
  notes?: string;
  submittedAt: string;
}

export interface VerificationResult {
  id: string;
  jobId: string;
  milestoneId: string;
  submissionId: string;
  verdict: VerificationVerdict;
  confidence: number;
  reasons: string[];
  createdAt: string;
}
