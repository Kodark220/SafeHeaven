"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useEscrows } from "@/lib/hooks"
import { EscrowCard } from "@/components/escrow"
import { EscrowAction } from "@/lib/escrow"
import { StaggerContainer, StaggerItem, FadeIn } from "@/components/ui/motion-wrapper"

export default function EscrowsPage() {
  const { data: escrows, isLoading } = useEscrows()

  // Mock current user - in real app this would come from auth context
  const currentUserId = "c1" // Assuming user is client for demo

  const handleEscrowAction = (
    escrowId: string,
    action: EscrowAction,
    params?: any
  ) => {
    // In a real app, this would trigger the appropriate mutation
    console.log(`Action ${action} on escrow ${escrowId}`, params)
    // For now, just log - full implementation would use the escrow state hooks
  }

  return (
    <div className="space-y-8">
      <FadeIn className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 border-b border-border/50 pb-6">
        <div>
          <p className="eyebrow mb-1">Portfolio Management</p>
          <h1 className="text-3xl sm:text-4xl font-bold gradient-heading">Active Protocol Units</h1>
        </div>
        <Link href="/dashboard/escrows/new" className="shrink-0">
          <Button className="h-12 px-6 rounded-xl font-bold text-xs uppercase tracking-widest w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Initialize Unit
          </Button>
        </Link>
      </FadeIn>

      {isLoading ? (
        <div className="text-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Synchronizing Ledgers...</p>
        </div>
      ) : !escrows || escrows.length === 0 ? (
        <div className="text-center py-20 bg-muted/40 rounded-3xl border border-dashed border-border animate-in fade-in zoom-in duration-500">
          <div className="p-4 bg-muted rounded-full w-fit mx-auto mb-4">
             <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">No active units detected in current epoch.</p>
          <Link href="/dashboard/escrows/new" className="mt-4 inline-block text-primary font-bold text-xs uppercase tracking-widest hover:underline">
            Create First Unit →
          </Link>
        </div>
      ) : (
        <StaggerContainer className="grid gap-8">
          {escrows.map((escrow) => (
            <StaggerItem key={escrow.id}>
              <EscrowCard
                escrow={escrow}
                currentUserId={currentUserId}
                onAction={handleEscrowAction}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  )
}