import { ActorProfile, Job, Submission, VerificationResult } from "./types.js";

export interface Store {
  actors: ActorProfile[];
  jobs: Job[];
  submissions: Submission[];
  verifications: VerificationResult[];
}

export const store: Store = {
  actors: [
    {
      id: "client_1",
      name: "Lena Growth Labs",
      walletAddress: "0xclient123",
      type: "client",
      categories: ["research", "growth"],
      completedCount: 12,
      passRate: 0.92,
      onTimeRate: 0.91,
      disputeRate: 0.05,
      averageRating: 4.8,
      totalEarnedUsd: 0
    },
    {
      id: "worker_1",
      name: "Amina Research",
      walletAddress: "0xworker123",
      type: "human",
      categories: ["research", "analysis"],
      completedCount: 19,
      passRate: 0.88,
      onTimeRate: 0.9,
      disputeRate: 0.08,
      averageRating: 4.7,
      totalEarnedUsd: 1840
    }
  ],
  jobs: [],
  submissions: [],
  verifications: []
};
