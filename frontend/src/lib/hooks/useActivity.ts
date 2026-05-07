"use client"

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { activityApi } from "@/lib/api"
import type { Activity } from "@/lib/types"

const ACTIVITY_KEY = ["activity"]

export function useActivities() {
  return useQuery({
    queryKey: ACTIVITY_KEY,
    queryFn: () => activityApi.getAll(),
    staleTime: 1000 * 60 * 2,
  })
}

export function useRecentActivities(limit: number = 10) {
  return useQuery({
    queryKey: [...ACTIVITY_KEY, "recent", limit],
    queryFn: async () => {
      const activities = await activityApi.getAll()
      return activities.slice(0, limit)
    },
    staleTime: 1000 * 60 * 2,
  })
}

export function useActivitiesByEscrow(escrowId: string) {
  return useQuery({
    queryKey: [...ACTIVITY_KEY, "escrow", escrowId],
    queryFn: async () => {
      const activities = await activityApi.getAll()
      return activities.filter(a => a.escrowId === escrowId)
    },
    enabled: !!escrowId,
    staleTime: 1000 * 60 * 2,
  })
}

export function useLogActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Activity, 'id' | 'timestamp'>) => activityApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACTIVITY_KEY })
    },
  })
}

export function useCreateActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Activity, 'id' | 'timestamp'>) => activityApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACTIVITY_KEY })
    },
  })
}

export function useDeleteActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => activityApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACTIVITY_KEY })
    },
  })
}
