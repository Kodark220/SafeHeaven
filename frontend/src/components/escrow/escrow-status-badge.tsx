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
          className: "border-slate-300 text-slate-500 font-bold"
        }
      case "funded":
        return {
          variant: "secondary" as const,
          label: "Funded",
          className: "bg-blue-50/50 text-blue-600 border-blue-200/50 font-bold"
        }
      case "in_progress":
        return {
          variant: "default" as const,
          label: "In Progress",
          className: "bg-slate-900 text-white font-bold"
        }
      case "awaiting_verification":
        return {
          variant: "secondary" as const,
          label: "Verification",
          className: "bg-amber-50/50 text-amber-600 border-amber-200/50 font-bold"
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
          className: "bg-slate-100 text-slate-600 border-slate-200 font-bold"
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
          className: "bg-indigo-50/50 text-indigo-600 border-indigo-200/50 font-bold"
        }
      case "cancelled":
        return {
          variant: "outline" as const,
          label: "Cancelled",
          className: "border-rose-200 text-rose-500 font-bold"
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