import React, { useState, useCallback } from "react"
import { useTransaction } from "@/lib/transaction"
import { useUpdateEscrow } from "@/lib/hooks/useEscrows"
import { useCreateVerification } from "@/lib/hooks/useVerification"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
  Shield,
  Zap,
  FileText,
  Search,
  Bot
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface VerifyMilestoneModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  escrowId: string
  milestoneId: string
  milestoneName: string
  milestoneAmount: number
  escrowCurrency?: string
}

export function VerifyMilestoneModal({
  isOpen,
  onOpenChange,
  escrowId,
  milestoneId,
  milestoneName,
  milestoneAmount,
  escrowCurrency = "USDC",
}: VerifyMilestoneModalProps) {
  const transaction = useTransaction()
  const updateEscrowMutation = useUpdateEscrow()
  const createVerificationMutation = useCreateVerification()

  const [verificationScore, setVerificationScore] = useState<string>("85")
  const [requiresHumanReview, setRequiresHumanReview] = useState(false)
  const [notes, setNotes] = useState<string>("")
  const [termsAccepted, setTermsAccepted] = useState(false)

  const handleVerify = useCallback(async () => {
    const score = parseInt(verificationScore)
    if (isNaN(score) || score < 0 || score > 100) {
      alert("Please enter a valid verification score (0-100)")
      return
    }

    if (!termsAccepted) {
      alert("Please accept the verification terms")
      return
    }

    try {
      // Initiate transaction
      await transaction.initiate("verify", escrowId)

      // Confirm transaction (simulates blockchain confirmation)
      await transaction.confirm()

      // Create verification record
      await createVerificationMutation.mutateAsync({
        escrowId,
        milestoneId,
        verificationScore: score,
        notes,
        requiresHumanReview,
        timestamp: new Date().toISOString(),
        verifier: "ai-agent", // Will be replaced with actual user role
      } as any)

      // Update milestone status to "verified"
      await updateEscrowMutation.mutateAsync({
        id: escrowId,
        data: {
          status: "milestone_verified" as any,
        },
      })

      // Reset form after success
      setVerificationScore("85")
      setRequiresHumanReview(false)
      setNotes("")
      setTermsAccepted(false)
    } catch (error) {
      console.error("Verification failed:", error)
    }
  }, [
    verificationScore,
    termsAccepted,
    notes,
    requiresHumanReview,
    transaction,
    escrowId,
    milestoneId,
    updateEscrowMutation,
    createVerificationMutation,
  ])

  const handleClose = () => {
    if (transaction.transaction.status !== "pending" && transaction.transaction.status !== "confirming") {
      transaction.reset()
      setVerificationScore("85")
      setRequiresHumanReview(false)
      setNotes("")
      setTermsAccepted(false)
      onOpenChange(false)
    }
  }

  const isLoading = transaction.transaction.status === "pending" || transaction.transaction.status === "confirming"
  const isSuccess = transaction.transaction.status === "success"
  const isError = transaction.transaction.status === "error"
  const score = parseInt(verificationScore) || 0

  // Determine score color
  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-green-600"
    if (s >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] bg-white/80 backdrop-blur-xl border-border/50 p-0 overflow-hidden rounded-3xl shadow-2xl">
        <DialogHeader className="p-8 pb-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="font-heading text-2xl font-bold text-slate-900">Proof Verification</DialogTitle>
          </div>
          <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Algorithmic Audit & Settlement Protocol
          </DialogDescription>
        </DialogHeader>

        {transaction.transaction.status === "idle" && (
          <div className="p-8 pt-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Milestone Details */}
            <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Milestone</span>
              </div>
              <p className="font-bold font-heading text-slate-900">{milestoneName}</p>
              <p className="text-xl font-bold text-primary mt-1">
                {milestoneAmount.toLocaleString()} {escrowCurrency}
              </p>
            </div>

            <div className="space-y-6">
              {/* Verification Score */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <Label htmlFor="score" className="text-xs font-bold uppercase tracking-wider text-slate-500">AI Confidence Target (%)</Label>
                  <span className={cn("text-lg font-bold font-heading", getScoreColor(score))}>
                    {score}%
                  </span>
                </div>
                <div className="relative pt-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={verificationScore}
                    onChange={(e) => setVerificationScore(e.target.value)}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  {score >= 80
                    ? "✓ AUTO-SETTLEMENT ELIGIBLE"
                    : score >= 60
                      ? "⚠ MANUAL AUDIT REQUIRED"
                      : "✗ CRITICAL DEVIATION DETECTED"}
                </p>
              </div>

              {/* Verification Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider text-slate-500">Audit Commentary</Label>
                <Textarea
                  id="notes"
                  placeholder="Define technical observations or discrepancy logs..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isLoading}
                  className="min-h-[120px] rounded-2xl bg-white/50 border-slate-200 focus:ring-primary/20 p-4 text-sm"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 gap-3">
                <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white/40 hover:bg-white transition-all cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-50 rounded-lg group-hover:bg-rose-100 transition-colors">
                      <AlertCircle className="h-4 w-4 text-rose-500" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Escalate to Human Node</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={requiresHumanReview}
                    onChange={(e) => setRequiresHumanReview(e.target.checked)}
                    disabled={isLoading}
                    className="w-5 h-5 rounded-md border-slate-300 text-primary focus:ring-primary/20"
                  />
                </label>

                <label className="flex items-start gap-3 p-4 rounded-2xl border border-primary/10 bg-primary/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    disabled={isLoading}
                    className="w-5 h-5 rounded-md border-primary/20 text-primary focus:ring-primary/20 mt-0.5"
                  />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed">
                    I attest that this verification data is generated via the GenLayer Protocol and adheres to the settlement terms of the active smart contract.
                  </span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 h-12 rounded-xl font-bold text-xs uppercase tracking-widest border-slate-200"
              >
                Abort
              </Button>
              <Button
                onClick={handleVerify}
                disabled={!termsAccepted || isLoading || score < 60}
                className="flex-1 h-12 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold text-xs uppercase tracking-widest"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  "Initiate Settlement"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Pending State - Processing with AI Scanning Animation */}
        {transaction.transaction.status === "pending" && (
          <div className="p-12 space-y-8 text-center animate-in fade-in duration-500">
            <div className="relative mx-auto w-48 h-64 bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800">
              {/* Document Placeholder */}
              <div className="p-6 space-y-4 opacity-20">
                <div className="h-2 w-3/4 bg-white/40 rounded" />
                <div className="h-2 w-full bg-white/20 rounded" />
                <div className="h-2 w-5/6 bg-white/20 rounded" />
                <div className="pt-4 space-y-2">
                  <div className="h-1 w-full bg-primary/20 rounded" />
                  <div className="h-1 w-2/3 bg-primary/20 rounded" />
                </div>
              </div>

              {/* Scanning Laser */}
              <motion.div 
                animate={{ 
                  top: ["0%", "100%", "0%"],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 2.5, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_rgba(59,130,246,0.8)] z-20"
              />
              
              {/* Data Particles */}
              <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      y: [-20, 300],
                      x: [Math.random() * 200, Math.random() * 200],
                      opacity: [0, 0.5, 0]
                    }}
                    transition={{ 
                      duration: 2 + Math.random() * 2, 
                      repeat: Infinity, 
                      delay: i * 0.5 
                    }}
                    className="absolute h-1 w-1 bg-primary/40 rounded-full"
                  />
                ))}
              </div>

              {/* AI Overlay */}
              <div className="absolute inset-0 bg-primary/5 flex items-center justify-center">
                 <Bot className="h-12 w-12 text-primary/20 animate-pulse" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Search className="h-4 w-4 text-primary animate-bounce" />
                <h3 className="text-lg font-bold font-heading text-slate-900 uppercase tracking-widest">AI Audit Active</h3>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                Scanning cryptographic proofs against <br/> protocol specifications...
              </p>
            </div>
            
            <div className="flex justify-center">
               <div className="px-4 py-2 rounded-full bg-slate-50 border border-slate-100 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">GenLayer Protocol Node: Active</span>
               </div>
            </div>
          </div>
        )}

        {/* Confirming State - Waiting for Confirmation */}
        {transaction.transaction.status === "confirming" && (
          <div className="space-y-4 py-8">
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Confirming Verification</p>
              <p className="text-xs text-muted-foreground mt-2">
                Block {transaction.transaction.confirmations} of 3
              </p>
            </div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full ${
                    i < transaction.transaction.confirmations
                      ? "bg-primary"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Success State */}
        {isSuccess && (
          <div className="space-y-4 py-8">
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <div className="text-center space-y-2">
              <p className="font-medium">Verification Submitted!</p>
              <p className="text-sm text-muted-foreground">
                Milestone &quot;{milestoneName}&quot; verified with score {verificationScore}%
              </p>
              {requiresHumanReview && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Flagged for human review
                  </AlertDescription>
                </Alert>
              )}
            </div>
            {transaction.transaction.data?.hash && (
              <div className="p-3 bg-muted rounded-lg break-all text-xs font-mono">
                <p className="text-muted-foreground mb-1">Transaction Hash:</p>
                <p>{transaction.transaction.data.hash}</p>
              </div>
            )}
            <Button
              onClick={() => {
                transaction.reset()
                onOpenChange(false)
              }}
              className="w-full"
            >
              Close
            </Button>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="space-y-4 py-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {transaction.transaction.data?.error || "Verification submission failed"}
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  transaction.reset()
                  setVerificationScore("85")
                  setRequiresHumanReview(false)
                }}
                className="flex-1"
              >
                Retry
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
