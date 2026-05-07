import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";

const prismaClientSingleton = () => new PrismaClient();

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

const seedActors: Prisma.ActorProfileCreateInput[] = [
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
];

export async function ensureSeedData(): Promise<void> {
  await prisma.$transaction([
    prisma.submission.updateMany({
      where: { submitterId: "agent_1" },
      data: { submitterId: "worker_1" }
    }),
    prisma.job.updateMany({
      where: { workerId: "agent_1" },
      data: { workerId: "worker_1" }
    })
  ]);

  await Promise.all(
    seedActors.map((actor) =>
      prisma.actorProfile.upsert({
        where: { id: actor.id },
        update: {},
        create: actor
      })
    )
  );

  await prisma.actorProfile.deleteMany({ where: { id: "agent_1" } });
}
