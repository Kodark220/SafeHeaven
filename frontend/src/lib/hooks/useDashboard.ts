"use client"

import { useQuery } from "@tanstack/react-query"
import { dashboardApi } from "@/lib/api"

const DASHBOARD_KEY = ["dashboard"]

export function useDashboardStats() {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, "stats"],
    queryFn: () => dashboardApi.getStats(),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  })
}
