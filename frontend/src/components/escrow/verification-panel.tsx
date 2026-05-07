"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Shield, CheckCircle, XCircle, AlertTriangle, Bot } from "lucide-react"
import type { Verification } from "@/lib/types"
import { StaggerContainer, StaggerItem, FadeIn } from "@/components/ui/motion-wrapper"
import { cn } from "@/lib/utils"

interface VerificationPanelProps {
  verifications: Verification[]
  escrowId: string
  className?: string
}

export function VerificationPanel({ verifications, escrowId, className }: VerificationPanelProps) {
  const getVerificationIcon = (status: Verification["status"]) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />
      case "failed":
        return <XCircle className="h-5 w-5 text-rose-500" />
      case "disputed":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      default:
        return <Shield className="h-5 w-5 text-slate-400" />
    }
  }

  const getVerificationStatusColor = (status: Verification["status"]) => {
    switch (status) {
      case "verified":
        return "text-emerald-700 bg-emerald-50/50 border-emerald-200/50"
      case "failed":
        return "text-rose-700 bg-rose-50/50 border-rose-200/50"
      case "disputed":
        return "text-amber-700 bg-amber-50/50 border-amber-200/50"
      default:
        return "text-slate-700 bg-slate-50/50 border-slate-200/50"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return "text-emerald-500"
    if (score >= 0.8) return "text-amber-500"
    return "text-rose-500"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 0.9) return "Excellent"
    if (score >= 0.8) return "Good"
    if (score >= 0.7) return "Fair"
    return "Poor"
  }

  const averageScore = verifications.length > 0
    ? verifications.reduce((sum, v) => sum + (v.aiScore || 0), 0) / verifications.length
    : 0

  const passedVerifications = verifications.filter(v => v.status === "verified").length
  const totalVerifications = verifications.length

  return (
    <Card className={cn("border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden", className)}>
      <CardHeader className="border-b border-border/50 bg-slate-50/30">
        <CardTitle className="text-lg flex items-center gap-2 font-heading">
          <Bot className="h-5 w-5 text-primary" />
          AI Verification Engine
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {verifications.length === 0 ? (
          <FadeIn className="text-center py-8 text-slate-500">
            <Shield className="h-12 w-12 mx-auto mb-4 text-slate-200" />
            <p className="font-medium">No verifications processed yet</p>
            <p className="text-sm">Submit a milestone to trigger AI review</p>
          </FadeIn>
        ) : (
          <div className="space-y-8">
            {/* Overall Score */}
            <FadeIn className="text-center bg-slate-50/50 rounded-2xl p-6 border border-border/50">
              <div className={cn("text-4xl font-bold font-heading mb-1", getScoreColor(averageScore))}>
                {Math.round(averageScore * 100)}%
              </div>
              <div className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                {getScoreLabel(averageScore)} Confidence
              </div>
              <div className="mt-4 max-w-xs mx-auto">
                <Progress
                  value={averageScore * 100}
                  className="h-2 bg-slate-200"
                />
              </div>
              <p className="text-xs text-slate-500 mt-3 font-medium">
                {passedVerifications} of {totalVerifications} checks passed successfully
              </p>
            </FadeIn>

            {/* Individual Verifications */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Detailed Logs</h4>
              <StaggerContainer className="space-y-3">
                {verifications.map((verification) => (
                  <StaggerItem key={verification.id} className="group flex items-center justify-between p-4 bg-white/50 border border-border/50 rounded-xl hover:bg-white transition-all hover:shadow-md">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-slate-50 rounded-full group-hover:scale-110 transition-transform">
                        {getVerificationIcon(verification.status)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 font-heading">
                          Milestone {verification.milestoneId}
                        </p>
                        <p className="text-xs text-slate-500 font-medium">
                          {new Date(verification.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn("text-lg font-bold font-heading", getScoreColor(verification.aiScore || 0))}>
                        {Math.round((verification.aiScore || 0) * 100)}%
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] font-bold uppercase tracking-tight py-0 px-2 h-5", getVerificationStatusColor(verification.status))}
                      >
                        {verification.status}
                      </Badge>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>

            {/* Human Review Overlay */}
            {verifications.some(v => v.humanReview) && (
              <FadeIn className="border-t border-border/50 pt-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 mb-4">Arbitrator Feedback</h4>
                <div className="space-y-3">
                  {verifications
                    .filter(v => v.humanReview)
                    .map((verification) => (
                      <div key={verification.id} className="text-sm p-4 bg-blue-50/30 border border-blue-100 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                          <span className="font-bold text-blue-900 font-heading text-xs">REVIEW BY {verification.reviewedBy?.toUpperCase()}</span>
                        </div>
                        {verification.notes && (
                          <p className="text-slate-700 leading-relaxed italic">
                            "{verification.notes}"
                          </p>
                        )}
                        <p className="text-[10px] text-blue-400 mt-2 font-bold">
                          VERIFIED ON {verification.reviewedAt ? new Date(verification.reviewedAt).toLocaleDateString().toUpperCase() : "N/A"}
                        </p>
                      </div>
                    ))}
                </div>
              </FadeIn>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}