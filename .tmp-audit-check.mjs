import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const jobId = "job_bd11b4d6-8464-450c-9ac4-c240e131324b";
const audits = await prisma.nanopaymentEvent.findMany({ where: { jobId }, orderBy: { createdAt: 'asc' } });
console.log(JSON.stringify(audits, (_, value) => value instanceof Date ? value.toISOString() : value, 2));
await prisma.$disconnect();
