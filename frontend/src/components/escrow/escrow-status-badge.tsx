"use client"

import { Badge } from "@/components/ui/badge"
import { EscrowStatus } from "@/lib/escrow"
import { cn } from "@/lib/utils"

interface EscrowStatusBadgeProps {
  status: EscrowStatus
  className?: string
}

export function EscrowStatusBadge({ status, className }: EscrowStatusBadgeProps) {
  const getStatusConfig = (status: EscrowStatus) => {
    switch (status) {
      case "draft":
        return {
          variant: "outline" as const,
          label: "Draft",
          className: "text-muted-foreground font-bold"
        }
      case "funded":
        return {
          variant: "secondary" as const,
          label: "Funded",
          className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 font-bold"
        }
      case "in_progress":
        return {
          variant: "default" as const,
          label: "In Progress",
          className: "bg-primary text-primary-foreground font-bold"
        }
      case "awaiting_verification":
        return {
          variant: "secondary" as const,
          label: "Verification",
          className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 font-bold"
        }
      case "approved":
        return {
          variant: "default" as const,
          label: "Approved",
          className: "bg-emerald-600 text-white font-bold"
        }
      case "released":
        return {
          variant: "secondary" as const,
          label: "Released",
          className: "bg-muted text-muted-foreground border-border font-bold"
        }
      case "disputed":
        return {
          variant: "destructive" as const,
          label: "Disputed",
          className: "bg-rose-600 text-white font-bold animate-pulse"
        }
      case "dispute_resolved":
        return {
          variant: "secondary" as const,
          label: "Resolved",
          className: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20 font-bold"
        }
      case "cancelled":
        return {
          variant: "outline" as const,
          label: "Cancelled",
          className: "border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold"
        }
      default:
        return {
          variant: "outline" as const,
          label: status,
          className: "font-bold"
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <Badge
      variant={config.variant}
      className={cn(
        "uppercase tracking-widest text-[9px] h-6 px-2.5 rounded-full",
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  )
}