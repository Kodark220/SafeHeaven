"use client"

import { useMilestones, useApproveMilestone, useRejectMilestone, useDisputeMilestone } from "@/lib/hooks/useMilestones"
import { useEscrows } from "@/lib/hooks"
import { MilestoneVerificationPanel } from "@/components/escrow"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle } from "lucide-react"

export default function ClientMilestonesPage() {
  const { data: allEscrows } = useEscrows()
  const approveMutation = useApproveMilestone()
  const rejectMutation = useRejectMilestone()
  const disputeMutation = useDisputeMilestone()

  // Get milestones for current client
  const currentUserId = "c1" // Mock - in real app from auth
  const clientEscrows = allEscrows?.filter(e => e.clientId === currentUserId) || []

  // Get all milestones for client's escrows
  const allMilestones = clientEscrows.flatMap(e =>
    (e.milestones || []).map(m => ({ ...m, escrowId: e.id, escrowTitle: e.title }))
  )

  // Filter pending milestones
  const pendingReview = allMilestones.filter(
    m => m.status === "under_verification" || m.status === "awaiting_submission"
  )
  const approved = allMilestones.filter(m => m.status === "approved")
  const rejected = allMilestones.filter(m => m.status === "needs_revision")
  const disputed = allMilestones.filter(m => m.status === "disputed")

  const handleApprove = async (milestoneId: string, escrowId: string, notes: string) => {
    try {
      await approveMutation.mutateAsync({ milestoneId, escrowId, notes })
      alert("Milestone approved!")
    } catch (error) {
      alert("Failed to approve milestone")
    }
  }

  const handleReject = async (milestoneId: string, escrowId: string, notes: string) => {
    try {
      await rejectMutation.mutateAsync({ milestoneId, escrowId, notes })
      alert("Milestone rejected!")
    } catch (error) {
      alert("Failed to reject milestone")
    }
  }

  const handleDispute = async (milestoneId: string, escrowId: string, reason: string) => {
    try {
      await disputeMutation.mutateAsync({ milestoneId, escrowId, reason })
      alert("Dispute opened!")
    } catch (error) {
      alert("Failed to open dispute")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Milestone Reviews</h1>
        <p className="text-muted-foreground">Review and approve worker milestone submissions</p>
      </div>

      {/* Pending Review */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Pending Review ({pendingReview.length})</h2>
        </div>

        {pendingReview.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">No pending milestone reviews</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingReview.map((milestone: any) => (
              <div key={milestone.id} className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{milestone.title}</h3>
                    <p className="text-sm text-muted-foreground">{(milestone as any).escrowTitle}</p>
                  </div>
                  <Badge>${(milestone.amount || milestone.amountUsd || 0).toLocaleString()}</Badge>
                </div>
                <MilestoneVerificationPanel
                  milestone={milestone}
                  isClient={true}
                  isLoading={
                    approveMutation.isPending ||
                    rejectMutation.isPending ||
                    disputeMutation.isPending
                  }
                  onApprove={(notes) =>
                    handleApprove(milestone.id, (milestone as any).escrowId, notes)
                  }
                  onReject={(notes) =>
                    handleReject(milestone.id, (milestone as any).escrowId, notes)
                  }
                  onDispute={(reason) =>
                    handleDispute(milestone.id, (milestone as any).escrowId, reason)
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved */}
      {approved.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">✓ Approved ({approved.length})</h2>
          <div className="grid grid-cols-1 gap-3">
            {approved.map((milestone: any) => (
              <Card key={milestone.id} className="bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{milestone.title}</p>
                      <p className="text-sm text-muted-foreground">{(milestone as any).escrowTitle}</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-600">${(milestone.amount || milestone.amountUsd || 0).toLocaleString()}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Rejected */}
      {rejected.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">✗ Rejected ({rejected.length})</h2>
          <div className="grid grid-cols-1 gap-3">
            {rejected.map((milestone: any) => (
              <Card key={milestone.id} className="bg-red-50 border-red-200">
                <CardContent className="pt-4">
                  <div>
                    <p className="font-medium">{milestone.title}</p>
                    <p className="text-sm text-muted-foreground">{milestone.clientReviewNotes}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Disputed */}
      {disputed.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">⚠ Disputed ({disputed.length})</h2>
          <div className="grid grid-cols-1 gap-3">
            {disputed.map((milestone: any) => (
              <Card key={milestone.id} className="bg-orange-50 border-orange-200">
                <CardContent className="pt-4">
                  <div>
                    <p className="font-medium">{milestone.title}</p>
                    <p className="text-sm text-muted-foreground">{milestone.clientReviewNotes}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
