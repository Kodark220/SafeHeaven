import { ActorProfile } from "@prisma/client";

import { prisma } from "../db.js";

export interface ReputationSnapshot {
  actor: ActorProfile;
  trustScore: number;
}

export function calculateTrustScore(actor: ActorProfile): number {
  const score =
    actor.passRate * 35 +
    actor.onTimeRate * 25 +
    (1 - actor.disputeRate) * 20 +
    Math.min(actor.averageRating / 5, 1) * 10 +
    Math.min(actor.completedCount / 50, 1) * 10;

  return Math.round(score);
}

export async function getReputationSnapshot(actorId: string): Promise<ReputationSnapshot | undefined> {
  const actor = await prisma.actorProfile.findUnique({ where: { id: actorId } });

  if (!actor) {
    return undefined;
  }

  return {
    actor,
    trustScore: calculateTrustScore(actor)
  };
}
