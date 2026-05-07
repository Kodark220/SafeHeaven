/**
 * API Client — calls the Express backend at NEXT_PUBLIC_API_URL.
 *
 * Replaces the mock‑data layer with real HTTP requests while keeping
 * the same interface signatures so hooks / components don't break.
 */

import type {
  Actor,
  Escrow,
  Milestone,
  Verification,
  Submission,
  Activity,
  DashboardStats,
} from "@/lib/types"

// Re‑export old name so `import { Worker } from "@/lib/types"` still works
export type { Actor as Worker } from "@/lib/types"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

function authHeaders(): HeadersInit {
  if (typeof window === "undefined") return {}
  const token = localStorage.getItem("arc_auth_token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message ?? `API ${res.status}`)
  }
  return res.json()
}

// ── helpers to map backend Job → frontend Escrow shape ─────

function jobToEscrow(job: any): Escrow {
  const milestones: Milestone[] = (job.milestones ?? []).map((m: any) => ({
    ...m,
    escrowId: job.id,
    amount: m.amountUsd,
    order: m.sequence,
  }))

  const completedCount = milestones.filter(
    (m) => m.status === "approved" || m.status === "released"
  ).length

  return {
    id: job.id,
    title: job.title,
    description: job.description,
    status: job.status,
    totalAmountUsd: job.totalAmountUsd,
    createdAt: job.createdAt,
    fundedAt: job.fundedAt,
    clientId: job.clientId,
    workerId: job.workerId,
    categoryTags: job.categoryTags ?? [],
    milestones,
    arcJobId: job.arcJobId,
    // compat aliases
    amount: job.totalAmountUsd,
    currency: "USD",
    updatedAt: job.createdAt,
    totalMilestonesCompleted: completedCount,
    totalMilestones: milestones.length,
  }
}

function actorToWorker(actor: any): Actor {
  return {
    id: actor.id,
    name: actor.name,
    walletAddress: actor.walletAddress,
    type: actor.type,
    categories: actor.categories ?? [],
    completedCount: actor.completedCount ?? 0,
    passRate: actor.passRate ?? 0,
    onTimeRate: actor.onTimeRate ?? 0,
    disputeRate: actor.disputeRate ?? 0,
    averageRating: actor.averageRating ?? 0,
    totalEarnedUsd: actor.totalEarnedUsd ?? 0,
    trustScore: actor.trustScore ?? 0,
  }
}

// ── Escrow / Job API ───────────────────────────────────────

export interface EscrowApi {
  getAll(): Promise<Escrow[]>
  getById(id: string): Promise<Escrow | null>
  create(data: any): Promise<Escrow>
  update(id: string, data: Partial<Escrow>): Promise<Escrow | null>
  delete(id: string): Promise<boolean>
}

export const escrowApi: EscrowApi = {
  getAll: async () => {
    const jobs = await apiFetch<any[]>("/jobs")
    return jobs.map(jobToEscrow)
  },

  getById: async (id) => {
    try {
      const job = await apiFetch<any>(`/jobs/${id}`)
      return jobToEscrow(job)
    } catch {
      return null
    }
  },

  create: async (data) => {
    const body = {
      title: data.title,
      description: data.description,
      clientId: data.clientId,
      workerId: data.workerId,
      categoryTags: data.categoryTags ?? [],
      milestones: (data.milestones ?? []).map((m: any, i: number) => ({
        title: m.title,
        description: m.description,
        amountUsd: m.amountUsd ?? m.amount ?? 0,
        dueDate: m.dueDate instanceof Date ? m.dueDate.toISOString() : m.dueDate,
        proofRequirements: m.proofRequirements ?? ["Proof of completion"],
        acceptanceCriteria: m.acceptanceCriteria ?? ["Work meets spec"],
      })),
    }
    const job = await apiFetch<any>("/jobs", {
      method: "POST",
      body: JSON.stringify(body),
    })
    return jobToEscrow(job)
  },

  // The backend doesn't expose a PATCH /jobs/:id yet —
  // keep as a local no‑op so the escrow state machine hooks still compile.
  update: async (_id, _data) => {
    // TODO: backend PUT/PATCH endpoint
    console.warn("escrowApi.update is not yet wired to the backend")
    return null
  },

  delete: async (_id) => {
    console.warn("escrowApi.delete is not yet wired to the backend")
    return false
  },
}

// ── Worker / Actor API ─────────────────────────────────────

export interface WorkerApi {
  getAll(): Promise<Actor[]>
  getById(id: string): Promise<Actor | null>
  create(data: any): Promise<Actor>
  update(id: string, data: Partial<Actor>): Promise<Actor | null>
  delete(id: string): Promise<boolean>
}

export const workerApi: WorkerApi = {
  getAll: async () => {
    const actors = await apiFetch<any[]>("/actors")
    return actors.map(actorToWorker)
  },

  getById: async (id) => {
    try {
      const actor = await apiFetch<any>(`/actors/${id}`)
      return actorToWorker(actor)
    } catch {
      return null
    }
  },

  create: async (_data) => {
    console.warn("workerApi.create is not yet wired to the backend")
    throw new Error("Not implemented")
  },

  update: async (_id, _data) => {
    console.warn("workerApi.update is not yet wired to the backend")
    return null
  },

  delete: async (_id) => {
    console.warn("workerApi.delete is not yet wired to the backend")
    return false
  },
}

// ── Milestone API ──────────────────────────────────────────
// Milestones come nested inside jobs — these helpers still work
// by fetching the parent job.

export interface MilestoneApi {
  getAll(): Promise<Milestone[]>
  getById(id: string): Promise<Milestone | null>
  create(data: any): Promise<Milestone>
  update(id: string, data: Partial<Milestone>): Promise<Milestone | null>
  delete(id: string): Promise<boolean>
}

export const milestoneApi: MilestoneApi = {
  getAll: async () => {
    const jobs = await apiFetch<any[]>("/jobs")
    return jobs.flatMap((job: any) =>
      (job.milestones ?? []).map((m: any) => ({
        ...m,
        escrowId: job.id,
        amount: m.amountUsd,
        order: m.sequence,
      }))
    )
  },

  getById: async (id) => {
    const all = await milestoneApi.getAll()
    return all.find((m) => m.id === id) ?? null
  },

  create: async (_data) => {
    console.warn("milestoneApi.create — milestones are created with the job")
    throw new Error("Not implemented")
  },

  update: async (_id, _data) => {
    console.warn("milestoneApi.update is not yet wired to the backend")
    return null
  },

  delete: async (_id) => {
    console.warn("milestoneApi.delete is not yet wired to the backend")
    return false
  },
}

// ── Submission API (new) ───────────────────────────────────

export async function createSubmission(
  jobId: string,
  milestoneId: string,
  data: { summary: string; proofLinks: string[]; notes?: string; submitterId: string }
) {
  return apiFetch<{ submission: Submission; verification: Verification; milestone: Milestone }>(
    `/jobs/${jobId}/milestones/${milestoneId}/submissions`,
    { method: "POST", body: JSON.stringify(data) }
  )
}

// ── Release Milestone API (new) ────────────────────────────

export async function releaseMilestone(jobId: string, milestoneId: string) {
  return apiFetch<{ job: Escrow; milestone: Milestone; payoutStatus: string; arcSync: any }>(
    `/jobs/${jobId}/milestones/${milestoneId}/release`,
    { method: "POST", body: JSON.stringify({}) }
  )
}

// ── Accept Job API (new) ───────────────────────────────────

export async function acceptJob(jobId: string, workerId: string) {
  return apiFetch<{ accepted: boolean; job: any }>(
    `/jobs/${jobId}/accept`,
    { method: "POST", body: JSON.stringify({ workerId }) }
  )
}

// ── Verification API ───────────────────────────────────────

export interface VerificationApi {
  getAll(): Promise<Verification[]>
  getById(id: string): Promise<Verification | null>
  create(data: any): Promise<Verification>
  update(id: string, data: Partial<Verification>): Promise<Verification | null>
  delete(id: string): Promise<boolean>
}

export const verificationApi: VerificationApi = {
  getAll: async () => {
    const vs = await apiFetch<any[]>("/verifications")
    return vs.map((v: any) => ({
      ...v,
      escrowId: v.jobId,
      status: v.verdict === "approved" ? "verified" : "failed",
      aiScore: v.confidence,
    }))
  },

  getById: async (id) => {
    const all = await verificationApi.getAll()
    return all.find((v) => v.id === id) ?? null
  },

  create: async (_data) => {
    // Verifications are created server-side when a submission is posted
    console.warn("verificationApi.create — verifications are created via submissions")
    throw new Error("Not implemented")
  },

  update: async (_id, _data) => {
    console.warn("verificationApi.update is not yet wired")
    return null
  },

  delete: async (_id) => {
    console.warn("verificationApi.delete is not yet wired")
    return false
  },
}

// ── Activity API (frontend-only, derived from jobs) ────────

export interface ActivityApi {
  getAll(): Promise<Activity[]>
  getById(id: string): Promise<Activity | null>
  create(data: any): Promise<Activity>
  delete(id: string): Promise<boolean>
}

export const activityApi: ActivityApi = {
  getAll: async () => {
    // Derive activities from jobs
    const jobs = await apiFetch<any[]>("/jobs")
    const activities: Activity[] = []
    let idx = 0

    for (const job of jobs) {
      activities.push({
        id: `a${++idx}`,
        type: "escrow_created",
        escrowId: job.id,
        title: "Escrow Created",
        description: `Escrow "${job.title}" was created`,
        actor: job.clientId,
        timestamp: new Date(job.createdAt),
      })

      if (job.fundedAt) {
        activities.push({
          id: `a${++idx}`,
          type: "escrow_funded",
          escrowId: job.id,
          title: "Escrow Funded",
          description: `Escrow "${job.title}" was funded`,
          actor: job.clientId,
          timestamp: new Date(job.fundedAt),
        })
      }

      for (const m of job.milestones ?? []) {
        if (m.status === "released" && m.releasedAt) {
          activities.push({
            id: `a${++idx}`,
            type: "funds_released",
            escrowId: job.id,
            title: "Milestone Released",
            description: `Milestone "${m.title}" funds released`,
            actor: "system",
            timestamp: new Date(m.releasedAt),
          })
        }
      }
    }

    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  },

  getById: async (id) => {
    const all = await activityApi.getAll()
    return all.find((a) => a.id === id) ?? null
  },

  create: async (_data) => {
    console.warn("activityApi.create — activities are derived from jobs")
    throw new Error("Not implemented")
  },

  delete: async (_id) => false,
}

// ── Dashboard API ──────────────────────────────────────────

export interface DashboardApi {
  getStats(): Promise<DashboardStats>
}

export const dashboardApi: DashboardApi = {
  getStats: async () => {
    const [jobs, actors] = await Promise.all([
      apiFetch<any[]>("/jobs"),
      apiFetch<any[]>("/actors"),
    ])

    const allMilestones = jobs.flatMap((j: any) => j.milestones ?? [])
    const completed = allMilestones.filter(
      (m: any) => m.status === "approved" || m.status === "released"
    )
    const activeJobs = jobs.filter(
      (j: any) => j.status === "funded" || j.status === "in_progress"
    )
    const doneJobs = jobs.filter((j: any) => j.status === "completed")

    let verifications: any[] = []
    try {
      verifications = await apiFetch<any[]>("/verifications")
    } catch {
      /* endpoint may not have data yet */
    }

    const avgScore =
      verifications.length > 0
        ? verifications.reduce((s: number, v: any) => s + (v.confidence ?? 0), 0) /
          verifications.length
        : 0

    return {
      totalEscrows: jobs.length,
      activeEscrows: activeJobs.length,
      completedEscrows: doneJobs.length,
      totalValue: jobs.reduce((s: number, j: any) => s + (j.totalAmountUsd ?? 0), 0),
      milestonesCompleted: completed.length,
      totalMilestones: allMilestones.length,
      averageVerificationScore: avgScore,
      activeWorkers: actors.filter((a: any) => a.type === "human").length,
    }
  },
}

// ── Wallet / Auth API (new) ────────────────────────────────

export async function walletChallenge(address: string, chainId?: number) {
  return apiFetch<{ nonce: string; message: string; expiresAt: string }>(
    "/wallet/challenge",
    {
      method: "POST",
      body: JSON.stringify({ address, chainId: chainId ?? 5042002 }),
    }
  )
}

export async function walletVerify(address: string, nonce: string, signature: string) {
  return apiFetch<{ token: string; actor: Actor | null }>(
    "/wallet/verify",
    {
      method: "POST",
      body: JSON.stringify({ address, nonce, signature }),
    }
  )
}

export async function walletMe() {
  return apiFetch<{ auth: any; actor: Actor | null }>("/wallet/me")
}

// ── Health / Integrations ──────────────────────────────────

export async function getHealth() {
  return apiFetch<{ status: string; service: string; integrations: any }>("/health")
}
