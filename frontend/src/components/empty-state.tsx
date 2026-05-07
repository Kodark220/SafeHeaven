"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <Card className="p-12">
      <div className="flex flex-col items-center justify-center text-center">
        {Icon && <Icon className="h-12 w-12 text-muted-foreground mb-4" />}
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-muted-foreground text-sm mt-1 max-w-sm">
          {description}
        </p>
        {action && (
          <Button onClick={action.onClick} className="mt-4">
            {action.label}
          </Button>
        )}
      </div>
    </Card>
  )
}

export function NoEscrows() {
  return (
    <EmptyState
      title="No escrows yet"
      description="You haven't created any escrows. Start by creating your first escrow to begin."
    />
  )
}

export function NoMilestones() {
  return (
    <EmptyState
      title="No milestones"
      description="This escrow doesn't have any milestones yet."
    />
  )
}

export function NoActivities() {
  return (
    <EmptyState
      title="No activities"
      description="No activities recorded for this escrow yet."
    />
  )
}

export function NoWorkers() {
  return (
    <EmptyState
      title="No workers found"
      description="There are no available workers at this time."
    />
  )
}
