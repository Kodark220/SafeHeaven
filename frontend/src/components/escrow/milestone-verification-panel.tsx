"use client"

import { Milestone } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, CheckCircle, XCircle, AlertTriangle, Music, Image as ImageIcon, Shield } from "lucide-react"
import { useState } from "react"

import { motion, AnimatePresence } from "framer-motion"
import { Progress } from "@/components/ui/progress"

interface MilestoneVerificationPanelProps {
  milestone: Milestone
  onApprove?: (notes: string) => void
  onReject?: (notes: string) => void
  onDispute?: (reason: string) => void
  isLoading?: boolean
  isClient?: boolean
}

export function MilestoneVerificationPanel({
  milestone,
  onApprove,
  onReject,
  onDispute,
  isLoading = false,
  isClient = false,
}: MilestoneVerificationPanelProps) {
  const [reviewNotes, setReviewNotes] = useState("")
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [showDisputeForm, setShowDisputeForm] = useState(false)

  if (!milestone.submission) {
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "needs_revision":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "disputed":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case "under_verification":
        return <AlertCircle className="h-5 w-5 text-blue-500" />
      case "pending_verification":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusGlow = (status: string) => {
    switch (status) {
      case "approved":
        return "shadow-green-500/20"
      case "rejected":
        return "shadow-red-500/20"
      case "disputed":
        return "shadow-orange-500/20"
      case "under_verification":
        return "shadow-blue-500/20"
      default:
        return "shadow-slate-500/20"
    }
  }

  const getFileIcon = (file: any) => {
    if (typeof file === "string") {
      if (file.includes("image")) return <ImageIcon className="h-4 w-4 text-blue-500" />
      if (file.includes("audio")) return <Music className="h-4 w-4 text-purple-500" />
    }
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={`glass-card overflow-hidden ${getStatusGlow(milestone.status)}`}>
        <div className={`h-1.5 w-full ${
          milestone.status === "approved" ? "bg-green-500" : 
          milestone.status === "needs_revision" ? "bg-red-500" : 
          milestone.status === "disputed" ? "bg-orange-500" : "bg-primary"
        }`} />
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                {getStatusIcon(milestone.status)}
              </div>
              <div>
                <CardTitle className="font-heading text-lg">Submission & Verification</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Submitted {new Date(milestone.submission.submittedAt).toLocaleString()}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="font-medium bg-white/50 backdrop-blur-sm">
              {milestone.status.replace("_", " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* AI Verification Score */}
          {milestone.aiScore !== undefined && (
            <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold font-heading">AI Trust Score</span>
                </div>
                <span className="text-sm font-bold text-primary">
                  {(milestone.aiScore * 100).toFixed(0)}%
                </span>
              </div>
              <Progress 
                value={milestone.aiScore * 100} 
                className={`h-2.5 ${milestone.aiScore >= 0.8 ? "[&>div]:bg-green-500" : "[&>div]:bg-orange-500"}`} 
              />
              <p className="text-[10px] text-muted-foreground text-center italic">
                {milestone.aiScore >= 0.8 
                  ? "AI confirms the submission matches the milestone criteria." 
                  : "AI detected potential discrepancies. Manual review suggested."}
              </p>
            </div>
          )}

          {/* Submission Notes */}
          {milestone.submission.notes && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Worker Notes</h4>
              <p className="text-sm leading-relaxed p-3 rounded-xl bg-white/30 dark:bg-slate-800/30 border border-white/20 dark:border-slate-700/20">
                {milestone.submission.notes}
              </p>
            </div>
          )}

          {/* Files */}
          {milestone.submission.files && milestone.submission.files.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Deliverables</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {milestone.submission.files.map((file: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-white/20 dark:border-slate-700/20 text-sm">
                    <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-md">
                      {getFileIcon(file)}
                    </div>
                    <span className="truncate font-medium">
                      {typeof file === "string" ? file.split('/').pop() : (file as any).name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Client Review Notes */}
          {milestone.clientReviewNotes && (
            <div className="space-y-2 border-t pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Client Feedback</h4>
              <p className="text-sm italic p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
                &quot;{milestone.clientReviewNotes}&quot;
              </p>
            </div>
          )}

          {/* Client Review Actions */}
          <AnimatePresence>
            {isClient && milestone.status === "under_verification" && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pt-4 border-t"
              >
                {!showRejectForm && !showDisputeForm && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={() => onApprove?.(reviewNotes)}
                      disabled={isLoading}
                      className="flex-1 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20 text-white font-heading"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve & Release
                    </Button>
                    <div className="flex gap-2 flex-1">
                      <Button
                        onClick={() => setShowRejectForm(true)}
                        disabled={isLoading}
                        variant="outline"
                        className="flex-1 font-heading"
                      >
                        <XCircle className="h-4 w-4 mr-2 text-red-500" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => setShowDisputeForm(true)}
                        disabled={isLoading}
                        variant="outline"
                        className="flex-1 font-heading"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
                        Dispute
                      </Button>
                    </div>
                  </div>
                )}

                {showRejectForm && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
                    <Textarea
                      placeholder="Explain why you're rejecting this milestone..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={3}
                      className="rounded-xl"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => onReject?.(reviewNotes)}
                        disabled={isLoading || !reviewNotes.trim()}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-heading"
                      >
                        Confirm Rejection
                      </Button>
                      <Button
                        onClick={() => {
                          setShowRejectForm(false)
                          setReviewNotes("")
                        }}
                        variant="outline"
                        className="flex-1 font-heading"
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}

                {showDisputeForm && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
                    <Textarea
                      placeholder="Describe the dispute reason..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={3}
                      className="rounded-xl"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => onDispute?.(reviewNotes)}
                        disabled={isLoading || !reviewNotes.trim()}
                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-heading"
                      >
                        Open Dispute
                      </Button>
                      <Button
                        onClick={() => {
                          setShowDisputeForm(false)
                          setReviewNotes("")
                        }}
                        variant="outline"
                        className="flex-1 font-heading"
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}
