"use client"

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { verificationApi } from "@/lib/api"
import type { Verification } from "@/lib/types"

const VERIFICATION_KEY = ["verification"]

export function useVerificationsByEscrow(escrowId: string) {
  return useQuery({
    queryKey: [...VERIFICATION_KEY, "escrow", escrowId],
    queryFn: async () => {
      const verifications = await verificationApi.getAll()
      return verifications.filter(v => v.jobId === escrowId || v.escrowId === escrowId)
    },
    enabled: !!escrowId,
    staleTime: 1000 * 60 * 2,
  })
}

export function useVerificationByMilestone(milestoneId: string) {
  return useQuery({
    queryKey: [...VERIFICATION_KEY, "milestone", milestoneId],
    queryFn: async () => {
      const verifications = await verificationApi.getAll()
      return verifications.filter(v => v.milestoneId === milestoneId)
    },
    enabled: !!milestoneId,
    staleTime: 1000 * 60 * 2,
  })
}

export function useVerifyMilestone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      escrowId,
      milestoneId,
      aiScore,
      humanReview = false,
      reviewedBy,
      notes,
    }: {
      escrowId: string
      milestoneId: string
      aiScore: number
      humanReview?: boolean
      reviewedBy?: string
      notes?: string
    }) => {
      // Verifications are created server-side via submission flow.
      // This is kept for backward compat but just invalidates.
      console.warn("Verifications are now handled server-side via submissions")
      return null
    },
    onSuccess: (_, { escrowId, milestoneId }) => {
      queryClient.invalidateQueries({
        queryKey: [...VERIFICATION_KEY, "escrow", escrowId],
      })
      queryClient.invalidateQueries({
        queryKey: [...VERIFICATION_KEY, "milestone", milestoneId],
      })
    },
  })
}

export function useCreateVerification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      console.warn("Verifications are now handled server-side via submissions")
      return null
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VERIFICATION_KEY })
    },
  })
}

export function useUpdateVerification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Verification> }) =>
      verificationApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VERIFICATION_KEY })
    },
  })
}
