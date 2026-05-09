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
      <FadeIn className="flex justify-between items-end border-b border-border/50 pb-6">
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Portfolio Management</p>
          <h1 className="text-4xl font-bold font-heading text-slate-900">Active Protocol Units</h1>
        </div>
        <Link href="/dashboard/escrows/new">
          <Button className="h-12 px-6 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-slate-200 transition-all flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Initialize Unit
          </Button>
        </Link>
      </FadeIn>

      {isLoading ? (
        <div className="text-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Synchronizing Ledgers...</p>
        </div>
      ) : !escrows || escrows.length === 0 ? (
        <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 animate-in fade-in zoom-in duration-500">
          <div className="p-4 bg-slate-100 rounded-full w-fit mx-auto mb-4">
             <Plus className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">No active units detected in current epoch.</p>
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