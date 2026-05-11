"use client"

import { useMemo, useState } from "react"
import { useAuth } from "@/lib/auth"
import { useEscrows, useUpdateEscrow } from "@/lib/hooks"
import { VerifyMilestoneModal } from "@/components/transaction"
import { ProtectedRoute } from "@/components/route-guards"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Shield, Zap, MessageSquare, CheckCircle2, Bot, ArrowRight } from "lucide-react"
import { DisputeTimeline } from "@/components/escrow/dispute-timeline"
import { StaggerContainer, StaggerItem, FadeIn } from "@/components/ui/motion-wrapper"
import { cn } from "@/lib/utils"

export default function VerificationPage() {
  const { selectedRole } = useAuth()
  const { data: escrows, isLoading } = useEscrows()
  const updateEscrowMutation = useUpdateEscrow()
  const [selectedEscrow, setSelectedEscrow] = useState<string | null>(null)
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const currentUserId = selectedRole === "client" ? "c1" : "w1"

  const workerEscrows = useMemo(
    () => escrows?.filter((escrow) => escrow.workerId === currentUserId) || [],
    [escrows, currentUserId]
  )

  const disputedEscrows = useMemo(
    () => escrows?.filter((escrow) => escrow.status === "disputed") || [],
    [escrows]
  )

  const pendingEscrows = useMemo(
    () => workerEscrows.filter((escrow) => escrow.status === "funded" || escrow.status === "in_progress"),
    [workerEscrows]
  )

  const handleOpenVerification = (escrowId: string, milestoneId: string) => {
    setSelectedEscrow(escrowId)
    setSelectedMilestoneId(milestoneId)
    setIsModalOpen(true)
  }

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        <FadeIn className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-border/50 pb-6">
          <div>
            <p className="eyebrow mb-1">Security & Compliance</p>
            <h1 className="text-3xl sm:text-4xl font-bold gradient-heading">Verification Center</h1>
            <p className="text-muted-foreground mt-2 max-w-lg">
              Manage cryptographic proofs, AI-verified milestones, and resolve project disputes in a secure, decentralized environment.
            </p>
          </div>
          <Badge variant="secondary" className="font-bold px-3 py-1 self-start sm:self-auto">
            <Bot className="h-3.5 w-3.5 mr-1.5" />
            {selectedRole?.toUpperCase() ?? "UNKNOWN"} VIEW
          </Badge>
        </FadeIn>

        {isLoading ? (
          <FadeIn className="rounded-3xl border border-dashed border-border bg-muted/40 p-20 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Synchronizing with node...</p>
          </FadeIn>
        ) : (
          <StaggerContainer className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
            <div className="space-y-8">
              {(selectedRole === "worker" || selectedRole === "agent") && (
                <StaggerItem>
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="surface-muted border-b border-border/50">
                      <CardTitle className="flex items-center gap-2 font-heading">
                        <Zap className="h-5 w-5 text-amber-500" />
                        Pending Proof Submissions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 space-y-6">
                      {pendingEscrows.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <Shield className="mx-auto h-12 w-12 mb-4 opacity-30" />
                          <p className="font-medium">No milestones require submission</p>
                        </div>
                      ) : (
                        pendingEscrows.map((escrow) => (
                          <div key={escrow.id} className="rounded-2xl border border-border/50 bg-muted/30 p-4 sm:p-5 hover:bg-accent/40 transition-all duration-300">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                              <div className="min-w-0">
                                <p className="font-bold text-foreground font-heading truncate">{escrow.title}</p>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter truncate">CLIENT ID: {escrow.clientId}</p>
                              </div>
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 font-bold text-[10px] shrink-0 self-start">
                                {escrow.status.replace("_", " ").toUpperCase()}
                              </Badge>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                              {escrow.milestones.map((milestone) => (
                                <div key={milestone.id} className="rounded-xl border border-border/50 bg-background/50 p-4 hover:border-primary/20 transition-colors">
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <p className="font-bold text-sm font-heading truncate">{milestone.title}</p>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest shrink-0">{milestone.status}</span>
                                  </div>
                                  <div className="flex items-center justify-between mt-4 gap-2">
                                    <span className="text-base font-bold text-foreground font-heading">
                                      ${(milestone.amount || milestone.amountUsd || 0).toLocaleString()}
                                    </span>
                                    <Button size="sm" onClick={() => handleOpenVerification(escrow.id, milestone.id)} className="h-8 text-xs px-4">
                                      Submit Proof
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </StaggerItem>
              )}

              <StaggerItem>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader className="surface-muted border-b border-border/50">
                    <CardTitle className="flex items-center gap-2 font-heading">
                      <MessageSquare className="h-5 w-5 text-blue-500" />
                      Protocol Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/50 bg-muted/30 p-5">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Network Health</p>
                        <p className="text-2xl font-bold font-heading text-foreground">{disputedEscrows.length} Active Disputes</p>
                      </div>
                      <Badge variant={disputedEscrows.length > 0 ? "destructive" : "secondary"} className="font-bold">
                        {disputedEscrows.length > 0 ? "INTERVENTION REQUIRED" : "OPERATIONAL"}
                      </Badge>
                    </div>
                    <div className="space-y-4 pt-2">
                      <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-accent/40 transition-colors">
                        <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground font-heading">Automated AI Oracle</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Verification scores are computed by decentralized LLM nodes upon proof submission.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-accent/40 transition-colors">
                        <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                          <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground font-heading">Human-in-the-Loop</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Complex disputes are escalated to human arbitrators to maintain protocol integrity.</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            </div>

            <div className="space-y-8">
              <StaggerItem>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="bg-rose-500/5 border-b border-rose-500/20">
                    <CardTitle className="flex items-center gap-2 font-heading text-rose-700 dark:text-rose-300">
                      <AlertCircle className="h-5 w-5" />
                      Active Disputes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-4">
                    {disputedEscrows.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <p className="text-sm font-medium">No disputes detected in current epoch</p>
                      </div>
                    ) : (
                      disputedEscrows.map((escrow) => (
                        <div key={escrow.id} className="rounded-2xl border border-rose-500/20 bg-muted/30 p-4 sm:p-5 hover:bg-accent/40 transition-all">
                          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                            <div className="min-w-0">
                              <p className="font-bold text-foreground font-heading truncate">{escrow.title}</p>
                              <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase break-all">INITIATED BY {escrow.disputeInitiator}</p>
                            </div>
                            <Badge variant="destructive" className="font-bold text-[10px] shrink-0">DISPUTED</Badge>
                          </div>
                          <div className="mt-2 pt-4 border-t border-border/50">
                             <DisputeTimeline escrow={escrow} />
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="border-slate-800 bg-slate-900 text-white shadow-xl dark:shadow-black/40">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-heading text-slate-100">
                      <Shield className="h-5 w-5 text-primary" />
                      Verification Guide
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-5">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-primary uppercase tracking-widest">Step 1</p>
                      <p className="text-sm text-slate-300">Submit relevant files or work links as cryptographic proof.</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-primary uppercase tracking-widest">Step 2</p>
                      <p className="text-sm text-slate-300">Wait for AI consensus to validate the submission against milestone criteria.</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-primary uppercase tracking-widest">Step 3</p>
                      <p className="text-sm text-slate-300">Upon approval, funds are automatically triggered for release via smart contract.</p>
                    </div>
                    <Button variant="outline" className="w-full mt-4 border-slate-700 bg-slate-800/40 text-white hover:bg-slate-800 transition-all font-bold">
                      Read Documentation <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </StaggerItem>
            </div>
          </StaggerContainer>
        )}

        <VerifyMilestoneModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          escrowId={selectedEscrow ?? ""}
          milestoneId={selectedMilestoneId ?? ""}
          milestoneName={"Proof Submission"}
          milestoneAmount={0}
        />
      </div>
    </ProtectedRoute>
  )
}

