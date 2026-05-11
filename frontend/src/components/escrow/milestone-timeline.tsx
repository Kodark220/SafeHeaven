"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, AlertCircle, Circle, MapPin } from "lucide-react"
import type { Milestone } from "@/lib/types"
import { StaggerContainer, StaggerItem, FadeIn } from "@/components/ui/motion-wrapper"
import { cn } from "@/lib/utils"

interface MilestoneTimelineProps {
  milestones: Milestone[]
  className?: string
}

export function MilestoneTimeline({ milestones, className }: MilestoneTimelineProps) {
  const getMilestoneIcon = (status: Milestone["status"]) => {
    switch (status) {
      case "approved":
      case "released":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />
      case "awaiting_submission":
      case "under_verification":
        return <Clock className="h-5 w-5 text-blue-500" />
      case "disputed":
      case "needs_revision":
        return <AlertCircle className="h-5 w-5 text-rose-500" />
      default:
        return <Circle className="h-5 w-5 text-muted-foreground/50" />
    }
  }

  const getMilestoneStatusColor = (status: Milestone["status"]) => {
    switch (status) {
      case "approved":
      case "released":
        return "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      case "awaiting_submission":
      case "under_verification":
        return "text-blue-700 dark:text-blue-400 bg-blue-500/10 border-blue-500/20"
      case "disputed":
      case "needs_revision":
        return "text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/20"
      default:
        return "text-muted-foreground bg-muted border-border"
    }
  }

  const sortedMilestones = [...milestones].sort((a, b) => (a.order || a.sequence || 0) - (b.order || b.sequence || 0))

  return (
    <Card className={cn("border-border/50 bg-card/50 backdrop-blur-sm", className)}>
      <CardHeader className="border-b border-border/50 surface-muted">
        <CardTitle className="text-lg flex items-center gap-2 font-heading">
          <MapPin className="h-5 w-5 text-primary" />
          Project Roadmap
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-8">
        <StaggerContainer className="space-y-0">
          {sortedMilestones.map((milestone, index) => (
            <StaggerItem key={milestone.id} className="relative pl-10 pb-10 last:pb-0 group">
              {/* Timeline Line */}
              {index < sortedMilestones.length - 1 && (
                <div className={cn(
                  "absolute left-[19px] top-10 w-[2px] h-full",
                  (milestone.status === "approved" || milestone.status === "released")
                    ? "bg-emerald-500/30"
                    : "bg-border"
                )} />
              )}

              {/* Timeline Icon */}
              <div className={cn(
                "absolute left-0 top-0 flex items-center justify-center w-10 h-10 rounded-full border-2 bg-background z-10 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md",
                (milestone.status === "approved" || milestone.status === "released") ? "border-emerald-500/40" : "border-border"
              )}>
                {getMilestoneIcon(milestone.status)}
              </div>

              <div className="bg-muted/30 border border-border/50 rounded-2xl p-4 sm:p-5 transition-all duration-300 group-hover:bg-accent/40 group-hover:shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="text-base font-bold text-foreground font-heading break-words">
                      {milestone.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                        PHASE {index + 1}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] font-bold uppercase tracking-tight h-5", getMilestoneStatusColor(milestone.status))}
                      >
                        {milestone.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <p className="text-lg font-bold text-foreground font-heading">
                      ${(milestone.amount || milestone.amountUsd || 0).toLocaleString()}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                      DUE {new Date(milestone.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase()}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-foreground/80 mt-3 leading-relaxed">
                  {milestone.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-border/50">
                  {milestone.completedAt && (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                        COMPLETED {new Date(milestone.completedAt).toLocaleDateString().toUpperCase()}
                      </span>
                    </div>
                  )}
                  {milestone.proofUrl && (
                    <a
                      href={milestone.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-primary hover:text-primary/80 uppercase tracking-widest flex items-center gap-1 group/link"
                    >
                      View Deliverables
                      <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                    </a>
                  )}
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {sortedMilestones.length === 0 && (
          <FadeIn className="text-center py-12 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-bold font-heading">No Milestones Defined</p>
            <p className="text-sm mt-1">This project roadmap is currently empty.</p>
          </FadeIn>
        )}
      </CardContent>
    </Card>
  )
}