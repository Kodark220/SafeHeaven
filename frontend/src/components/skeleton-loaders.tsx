"use client"

import { Card } from "@/components/ui/card"

export function EscrowCardSkeleton() {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-8 w-20 bg-muted rounded animate-pulse" />
      </div>
      
      <div className="flex justify-between">
        <div className="h-8 w-24 bg-muted rounded animate-pulse" />
        <div className="h-8 w-24 bg-muted rounded animate-pulse" />
      </div>

      <div className="space-y-2">
        <div className="h-2 w-full bg-muted rounded animate-pulse" />
        <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
      </div>

      <div className="flex gap-2 pt-2">
        <div className="h-10 flex-1 bg-muted rounded animate-pulse" />
        <div className="h-10 flex-1 bg-muted rounded animate-pulse" />
      </div>
    </Card>
  )
}

export function EscrowListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <EscrowCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-6">
          <div className="space-y-3">
            <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
            <div className="h-8 w-1/2 bg-muted rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
          </div>
        </Card>
      ))}
    </div>
  )
}

export function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-8 w-8 bg-muted rounded-full animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
            <div className="h-4 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <StatsSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="h-6 w-1/3 bg-muted rounded animate-pulse mb-4" />
            <EscrowListSkeleton count={3} />
          </Card>
        </div>
        <Card className="p-6">
          <div className="h-6 w-1/3 bg-muted rounded animate-pulse mb-4" />
          <TimelineSkeleton />
        </Card>
      </div>
    </div>
  )
}
