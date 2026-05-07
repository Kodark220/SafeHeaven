"use client"

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { workerApi } from "@/lib/api"
import type { Actor } from "@/lib/types"

/** @deprecated Use Actor */
export type Worker = Actor

const WORKERS_KEY = ["workers"]

export function useWorkers() {
  return useQuery({
    queryKey: WORKERS_KEY,
    queryFn: () => workerApi.getAll(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useWorker(id: string) {
  return useQuery({
    queryKey: [...WORKERS_KEY, id],
    queryFn: () => workerApi.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

export function useActiveWorkers() {
  return useQuery({
    queryKey: [...WORKERS_KEY, "active"],
    queryFn: async () => {
      const workers = await workerApi.getAll()
      // All actors from backend are "active" (no status field)
      return workers
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useWorkerStats(id: string) {
  return useQuery({
    queryKey: [...WORKERS_KEY, id, "stats"],
    queryFn: async () => {
      const worker = await workerApi.getById(id)
      if (!worker) return null

      return {
        completed: worker.completedCount,
        rating: worker.averageRating,
        earnings: worker.totalEarnedUsd,
      }
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  })
}

export function useCreateWorker() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => workerApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKERS_KEY })
    },
  })
}

export function useUpdateWorker() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Actor> }) =>
      workerApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: WORKERS_KEY })
      queryClient.invalidateQueries({ queryKey: [...WORKERS_KEY, id] })
    },
  })
}

export function useDeleteWorker() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => workerApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKERS_KEY })
    },
  })
}
