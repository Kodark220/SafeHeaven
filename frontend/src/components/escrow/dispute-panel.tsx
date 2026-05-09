"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, Scale, User, MessageSquare, ShieldAlert, CheckCircle } from "lucide-react"
import { useState } from "react"
import { FadeIn } from "@/components/ui/motion-wrapper"
import { cn } from "@/lib/utils"

interface DisputePanelProps {
  escrowId: string
  disputeReason?: string
  disputeResolution?: string
  disputeInitiator?: string
  isDisputed: boolean
  isResolved: boolean
  currentUserId: string
  onOpenDispute?: (reason: string) => void
  onResolveDispute?: (resolution: string) => void
  className?: string
}

export function DisputePanel({
  escrowId,
  disputeReason,
  disputeResolution,
  disputeInitiator,
  isDisputed,
  isResolved,
  currentUserId,
  onOpenDispute,
  onResolveDispute,
  className
}: DisputePanelProps) {
  const [disputeText, setDisputeText] = useState("")
  const [resolutionText, setResolutionText] = useState("")
  const [showDisputeForm, setShowDisputeForm] = useState(false)
  const [showResolutionForm, setShowResolutionForm] = useState(false)

  const handleOpenDispute = () => {
    if (disputeText.trim()) {
      onOpenDispute?.(disputeText.trim())
      setDisputeText("")
      setShowDisputeForm(false)
    }
  }

  const handleResolveDispute = () => {
    if (resolutionText.trim()) {
      onResolveDispute?.(resolutionText.trim())
      setResolutionText("")
      setShowResolutionForm(false)
    }
  }

  if (isResolved) {
    return (
      <FadeIn>
        <Card className={cn("border-emerald-200/50 bg-emerald-50/30 backdrop-blur-sm", className)}>
          <CardHeader className="border-b border-emerald-100/50">
            <CardTitle className="text-lg flex items-center gap-2 text-emerald-800 font-heading">
              <CheckCircle className="h-5 w-5" />
              Conflict Resolved
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="p-5 bg-white/60 border border-emerald-100 rounded-2xl">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Final Resolution Outcome</p>
              <p className="text-sm text-slate-700 leading-relaxed font-medium italic">&quot;{disputeResolution}&quot;</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 font-bold border-emerald-200 px-3">
                ARBITRATION SETTLED
              </Badge>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    )
  }

  if (isDisputed) {
    return (
      <FadeIn>
        <Card className={cn("border-rose-200/50 bg-rose-50/30 backdrop-blur-sm", className)}>
          <CardHeader className="border-b border-rose-100/50">
            <CardTitle className="text-lg flex items-center gap-2 text-rose-800 font-heading">
              <ShieldAlert className="h-5 w-5 animate-pulse" />
              Active Protocol Dispute
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="p-5 bg-white/60 border border-rose-100 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-3 w-3 text-rose-600" />
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-tighter">
                  INITIATED BY: {disputeInitiator}
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Incident Description</p>
              <p className="text-sm text-slate-800 leading-relaxed font-medium italic">&quot;{disputeReason}&quot;</p>
            </div>

            {/* Resolution Form for Arbitrators/Admins */}
            {!showResolutionForm ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResolutionForm(true)}
                className="w-full sm:w-auto h-10 border-rose-200 text-rose-700 hover:bg-rose-100/50 font-bold px-6 rounded-xl"
              >
                <Scale className="h-4 w-4 mr-2" />
                DETERMINE RESOLUTION
              </Button>
            ) : (
              <FadeIn className="space-y-4">
                <Textarea
                  placeholder="Enter detailed arbitration results..."
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  className="min-h-[120px] bg-white/80 border-rose-100 focus-visible:ring-rose-200 rounded-xl"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleResolveDispute}
                    disabled={!resolutionText.trim()}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-9 px-4 rounded-lg"
                  >
                    SUBMIT SETTLEMENT
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowResolutionForm(false)
                      setResolutionText("")
                    }}
                    className="h-9 px-4 rounded-lg border-rose-100"
                  >
                    CANCEL
                  </Button>
                </div>
              </FadeIn>
            )}

            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="font-bold tracking-widest px-3 border-rose-200 shadow-sm animate-pulse">
                PENDING ARBITRATOR
              </Badge>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    )
  }

  // No dispute - show option to open dispute
  return (
    <FadeIn>
      <Card className={cn("border-border/50 bg-card/50 backdrop-blur-sm", className)}>
        <CardHeader className="bg-slate-50/30 border-b border-border/50">
          <CardTitle className="text-lg flex items-center gap-2 font-heading">
            <MessageSquare className="h-5 w-5 text-primary" />
            Dispute Resolution Center
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-start gap-3 p-4 bg-slate-100/50 border border-slate-200 rounded-2xl">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600 leading-relaxed">
              Facing an issue? You may initiate a formal dispute. This triggers a manual review by protocol arbitrators and may delay the distribution of funds.
            </p>
          </div>

          {!showDisputeForm ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDisputeForm(true)}
              className="h-10 border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 font-bold px-6 rounded-xl transition-all"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              INITIATE DISPUTE
            </Button>
          ) : (
            <FadeIn className="space-y-4">
              <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">Incident Report</p>
              <Textarea
                placeholder="Describe the discrepancy in detail for the arbitrator..."
                value={disputeText}
                onChange={(e) => setDisputeText(e.target.value)}
                className="min-h-[120px] bg-white border-slate-200 focus-visible:ring-primary rounded-xl"
              />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleOpenDispute}
                  disabled={!disputeText.trim()}
                  className="font-bold h-9 px-4 rounded-lg"
                >
                  SUBMIT INCIDENT
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowDisputeForm(false)
                    setDisputeText("")
                  }}
                  className="h-9 px-4 rounded-lg"
                >
                  CANCEL
                </Button>
              </div>
            </FadeIn>
          )}
        </CardContent>
      </Card>
    </FadeIn>
  )
}