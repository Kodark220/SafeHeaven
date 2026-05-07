"use client"

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { milestoneApi, createSubmission, releaseMilestone as apiRelease } from "@/lib/api"
import type { Milestone } from "@/lib/types"

const MILESTONES_KEY = ["milestones"]

export function useMilestones(escrowId: string) {
  return useQuery({
    queryKey: [...MILESTONES_KEY, escrowId],
    queryFn: async () => {
      const milestones = await milestoneApi.getAll()
      return milestones.filter(m => m.jobId === escrowId || m.escrowId === escrowId)
    },
    enabled: !!escrowId,
    staleTime: 1000 * 60 * 2,
  })
}

export function useMilestone(id: string) {
  return useQuery({
    queryKey: [...MILESTONES_KEY, "detail", id],
    queryFn: () => milestoneApi.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateMilestone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Milestone, 'id'>) => milestoneApi.create(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({
        queryKey: [...MILESTONES_KEY, data.jobId ?? (data as any).escrowId],
      })
    },
  })
}

export function useUpdateMilestoneStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return milestoneApi.update(id, { status: status as any })
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: MILESTONES_KEY })
      queryClient.invalidateQueries({ queryKey: [...MILESTONES_KEY, "detail", id] })
    },
  })
}

export function useUpdateMilestone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Milestone> }) =>
      milestoneApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: MILESTONES_KEY })
      queryClient.invalidateQueries({ queryKey: [...MILESTONES_KEY, "detail", id] })
    },
  })
}

/**
 * Submit a milestone with proof links (calls the real backend)
 */
export function useSubmitMilestone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      milestoneId,
      jobId,
      summary,
      proofLinks,
      notes,
      submitterId,
    }: {
      milestoneId: string
      jobId: string
      summary: string
      proofLinks: string[]
      notes?: string
      submitterId: string
    }) => {
      return createSubmission(jobId, milestoneId, {
        summary,
        proofLinks,
        notes,
        submitterId,
      })
    },
    onSuccess: (_, { milestoneId, jobId }) => {
      queryClient.invalidateQueries({ queryKey: MILESTONES_KEY })
      queryClient.invalidateQueries({ queryKey: [...MILESTONES_KEY, "detail", milestoneId] })
      queryClient.invalidateQueries({ queryKey: [...MILESTONES_KEY, jobId] })
      queryClient.invalidateQueries({ queryKey: ["escrows"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] })
    },
  })
}

/**
 * Approve milestone — for UI backward compat.
 * The backend handles approval via the submission + verification flow.
 */
export function useApproveMilestone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      milestoneId,
      escrowId,
      notes,
    }: {
      milestoneId: string
      escrowId: string
      notes?: string
    }) => {
      // Approval happens server-side. We just invalidate.
      return milestoneApi.update(milestoneId, {
        status: "approved" as any,
      })
    },
    onSuccess: (_, { milestoneId, escrowId }) => {
      queryClient.invalidateQueries({ queryKey: MILESTONES_KEY })
      queryClient.invalidateQueries({ queryKey: [...MILESTONES_KEY, escrowId] })
      queryClient.invalidateQueries({ queryKey: [...MILESTONES_KEY, "detail", milestoneId] })
      queryClient.invalidateQueries({ queryKey: ["escrows"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] })
    },
  })
}

/**
 * Reject milestone
 */
export function useRejectMilestone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      milestoneId,
      escrowId,
      notes,
    }: {
      milestoneId: string
      escrowId: string
      notes: string
    }) => {
      return milestoneApi.update(milestoneId, {
        status: "needs_revision" as any,
      })
    },
    onSuccess: (_, { milestoneId, escrowId }) => {
      queryClient.invalidateQueries({ queryKey: MILESTONES_KEY })
      queryClient.invalidateQueries({ queryKey: [...MILESTONES_KEY, escrowId] })
      queryClient.invalidateQueries({ queryKey: [...MILESTONES_KEY, "detail", milestoneId] })
      queryClient.invalidateQueries({ queryKey: ["escrows"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] })
    },
  })
}

/**
 * Dispute milestone
 */
export function useDisputeMilestone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      milestoneId,
      escrowId,
      reason,
    }: {
      milestoneId: string
      escrowId: string
      reason: string
    }) => {
      return milestoneApi.update(milestoneId, {
        status: "disputed" as any,
      })
    },
    onSuccess: (_, { milestoneId, escrowId }) => {
      queryClient.invalidateQueries({ queryKey: MILESTONES_KEY })
      queryClient.invalidateQueries({ queryKey: [...MILESTONES_KEY, escrowId] })
      queryClient.invalidateQueries({ queryKey: [...MILESTONES_KEY, "detail", milestoneId] })
      queryClient.invalidateQueries({ queryKey: ["escrows"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] })
    },
  })
}

/**
 * Release an approved milestone (calls POST /jobs/:jobId/milestones/:milestoneId/release)
 */
export function useReleaseMilestone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      milestoneId,
      jobId,
    }: {
      milestoneId: string
      jobId: string
    }) => {
      return apiRelease(jobId, milestoneId)
    },
    onSuccess: (_, { milestoneId, jobId }) => {
      queryClient.invalidateQueries({ queryKey: MILESTONES_KEY })
      queryClient.invalidateQueries({ queryKey: [...MILESTONES_KEY, jobId] })
      queryClient.invalidateQueries({ queryKey: ["escrows"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] })
    },
  })
}

export function useInvalidateMilestones() {
  const queryClient = useQueryClient()
  return (escrowId?: string) => {
    if (escrowId) {
      queryClient.invalidateQueries({
        queryKey: [...MILESTONES_KEY, escrowId],
      })
    } else {
      queryClient.invalidateQueries({ queryKey: MILESTONES_KEY })
    }
  }
}

export function useEscrowAutoRelease() {
  const queryClient = useQueryClient()

  const checkAndReleaseEscrow = async (escrowId: string) => {
    try {
      const milestones = await milestoneApi.getAll()
      const escrowMilestones = milestones.filter(m => m.jobId === escrowId || m.escrowId === escrowId)
      const allApproved = escrowMilestones.every(m => m.status === "approved" || m.status === "released")

      if (allApproved && escrowMilestones.length > 0) {
        console.log(`All milestones approved for escrow ${escrowId}`)
        queryClient.invalidateQueries({ queryKey: ["escrows"] })
        queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] })
        return true
      }
      return false
    } catch (error) {
      console.error("Failed to check escrow auto-release:", error)
      return false
    }
  }

  return { checkAndReleaseEscrow }
}
