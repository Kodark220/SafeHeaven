"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EscrowStatusBadge } from "./escrow-status-badge"
import { MilestoneTimeline } from "./milestone-timeline"
import { VerificationPanel } from "./verification-panel"
import { ActionPanel } from "./action-panel"
import { DisputePanel } from "./dispute-panel"
import { DollarSign, Calendar, User, Bot, FileText, Info } from "lucide-react"
import { HoverCard, FadeIn } from "@/components/ui/motion-wrapper"
import type { Escrow } from "@/lib/types"
import type { EscrowAction } from "@/lib/escrow"
import { cn } from "@/lib/utils"

interface EscrowCardProps {
  escrow: Escrow
  currentUserId: string
  showMilestones?: boolean
  showVerification?: boolean
  showActions?: boolean
  showDispute?: boolean
  onAction?: (escrowId: string, action: EscrowAction, params?: any) => void
  className?: string
}

export function EscrowCard({
  escrow,
  currentUserId,
  showMilestones = true,
  showVerification = true,
  showActions = true,
  showDispute = true,
  onAction,
  className
}: EscrowCardProps) {
  const isClient = currentUserId === escrow.clientId
  const isWorker = currentUserId === escrow.workerId

  const handleAction = (action: EscrowAction, params?: any) => {
    onAction?.(escrow.id, action, params)
  }

  const progress = (escrow.totalMilestones || 0) > 0
    ? Math.round(((escrow.totalMilestonesCompleted || 0) / (escrow.totalMilestones || 1)) * 100)
    : 0

  return (
    <FadeIn>
      <HoverCard>
        <Card className={cn("border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden", className)}>
          <CardHeader className="bg-slate-50/30 border-b border-border/50 pb-6">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold font-heading text-slate-900">{escrow.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                    Protocol ID: {escrow.id}
                  </p>
                  <div className="h-1 w-1 rounded-full bg-slate-300" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                    Epoch: {new Date(escrow.createdAt).getFullYear()}
                  </p>
                </div>
              </div>
              <EscrowStatusBadge status={escrow.status} />
            </div>
          </CardHeader>

          <CardContent className="p-8 space-y-10">
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <DollarSign className="h-3 w-3" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Locked Capital</span>
                </div>
                <p className="text-2xl font-bold font-heading text-slate-900">
                  ${(escrow.totalAmountUsd || escrow.amount || 0).toLocaleString()}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="h-3 w-3" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Activation Date</span>
                </div>
                <p className="text-sm font-bold text-slate-700">
                  {new Date(escrow.createdAt).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <User className="h-3 w-3" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Client Principal</span>
                </div>
                <Badge variant="secondary" className="font-mono text-[10px] bg-slate-100 text-slate-600 border-slate-200">
                  {escrow.clientId}
                </Badge>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Bot className="h-3 w-3" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Worker Node</span>
                </div>
                <Badge variant="secondary" className="font-mono text-[10px] bg-slate-100 text-slate-600 border-slate-200">
                  {escrow.workerId}
                </Badge>
              </div>
            </div>

            {/* Description Segment */}
            <div className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100/50">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Engagement Overview</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {escrow.description}
              </p>
            </div>

            {/* Progress Visualization */}
            <div className="relative group">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold font-heading text-slate-900">Milestone Velocity</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                    {escrow.totalMilestonesCompleted || 0} OF {escrow.totalMilestones || 0} VERIFIED STAGES
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold font-heading text-primary leading-none">
                    {progress}%
                  </span>
                </div>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]" />
                </div>
              </div>
            </div>

            {/* Interactive Status Badges */}
            <div className="flex gap-2">
              {isClient && (
                <Badge className="bg-blue-600/10 text-blue-700 border-blue-200/50 hover:bg-blue-600/20 font-bold uppercase tracking-tighter text-[9px]">
                  Authorized Principal
                </Badge>
              )}
              {isWorker && (
                <Badge className="bg-emerald-600/10 text-emerald-700 border-emerald-200/50 hover:bg-emerald-600/20 font-bold uppercase tracking-tighter text-[9px]">
                  Authenticated Provider
                </Badge>
              )}
              <Badge variant="outline" className="text-[9px] font-bold text-slate-400 border-slate-200 uppercase tracking-tighter">
                <Info className="h-2 w-2 mr-1" />
                AI-Secured
              </Badge>
            </div>

            <div className="space-y-8 pt-4 border-t border-slate-100">
              {/* Conditional Components */}
              {showMilestones && escrow.milestones.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Project Roadmap</h4>
                  <MilestoneTimeline milestones={escrow.milestones} />
                </div>
              )}

              {showVerification && (escrow.verifications?.length || 0) > 0 && (
                <VerificationPanel
                  verifications={escrow.verifications || []}
                  escrowId={escrow.id}
                />
              )}

              {showActions && (
                <ActionPanel
                  escrow={escrow}
                  currentUserId={currentUserId}
                  onAction={handleAction}
                />
              )}

              {showDispute && (
                <DisputePanel
                  escrowId={escrow.id}
                  disputeReason={escrow.disputeReason}
                  disputeResolution={escrow.disputeResolution}
                  disputeInitiator={escrow.disputeInitiator}
                  isDisputed={escrow.status === "disputed"}
                  isResolved={escrow.status === "dispute_resolved"}
                  currentUserId={currentUserId}
                  onOpenDispute={(reason) => handleAction("open_dispute", {
                    disputeReason: reason,
                    disputeInitiator: currentUserId
                  })}
                  onResolveDispute={(resolution) => handleAction("resolve_dispute", {
                    resolution,
                    arbitratorId: currentUserId
                  })}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </HoverCard>
    </FadeIn>
  )
}