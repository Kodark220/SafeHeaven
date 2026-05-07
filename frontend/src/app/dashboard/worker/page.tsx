"use client"

import Link from "next/link"
import { StatusCard } from "@/components/status-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, Clock, Shield, Users, Play, CheckCircle, ArrowUpRight } from "lucide-react"
import { useEscrows, useDashboardStats } from "@/lib/hooks"
import { StaggerContainer, StaggerItem, FadeIn } from "@/components/ui/motion-wrapper"
import { cn } from "@/lib/utils"

export default function WorkerDashboardPage() {
  const { data: allEscrows } = useEscrows()
  const { data: stats } = useDashboardStats()

  // Filter escrows for current worker
  const currentUserId = "w1" // Mock - in real app from auth
  const workerEscrows = allEscrows?.filter(e => e.workerId === currentUserId) || []

  // Calculate worker-specific stats
  const activeJobs = workerEscrows.filter(e => e.status === "in_progress").length
  const availableJobs = workerEscrows.filter(e => e.status === "funded").length
  const completedJobs = workerEscrows.filter(e => e.status === "released").length
  const totalEarnings = workerEscrows
    .filter(e => e.status === "released")
    .reduce((sum, e) => sum + (e.totalAmountUsd || e.amount || 0), 0)

  // Get pending milestones across all worker's escrows
  const pendingMilestones = workerEscrows
    .filter(e => e.status === "in_progress")
    .reduce((sum, e) => sum + ((e.totalMilestones || 0) - (e.totalMilestonesCompleted || 0)), 0)

  return (
    <div className="space-y-8">
      <FadeIn className="flex justify-between items-end border-b border-border/50 pb-6">
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Worker Portal</p>
          <h1 className="text-4xl font-bold font-heading">Service Dashboard</h1>
        </div>
        <Badge variant="secondary" className="bg-blue-50/50 text-blue-700 border-blue-100 font-bold px-3 py-1 uppercase tracking-tighter text-[10px]">
          Verified Agent Worker
        </Badge>
      </FadeIn>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StaggerItem>
          <StatusCard
            title="Active Engagements"
            value={String(activeJobs)}
            status="success"
            icon={<Play className="h-4 w-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatusCard
            title="Available Pipeline"
            value={String(availableJobs)}
            status={availableJobs > 0 ? "warning" : "success"}
            icon={<Clock className="h-4 w-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatusCard
            title="Pending Proofs"
            value={String(pendingMilestones)}
            status={pendingMilestones > 0 ? "warning" : "success"}
            icon={<CheckCircle className="h-4 w-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatusCard
            title="Total Revenue"
            value={`$${totalEarnings.toLocaleString()}`}
            status="success"
            icon={<DollarSign className="h-4 w-4" />}
          />
        </StaggerItem>
      </StaggerContainer>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-8">
        <StaggerItem>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden h-full">
            <CardHeader className="bg-slate-50/30 border-b border-border/50">
              <CardTitle className="font-heading text-lg">Current Assignments</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {workerEscrows.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="font-medium">No active job assignments</p>
                </div>
              ) : (
                <StaggerContainer className="space-y-4">
                  {workerEscrows.slice(0, 4).map((escrow) => (
                    <StaggerItem key={escrow.id} className="group flex items-center justify-between p-5 bg-white/40 border border-border/50 rounded-2xl hover:bg-white transition-all duration-300 hover:shadow-md">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900 font-heading leading-tight">{escrow.title}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          CLIENT: {escrow.clientId}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-tight py-0 px-2 h-5",
                              escrow.status === "in_progress" ? "border-emerald-200 text-emerald-700 bg-emerald-50/50" : "border-slate-200 text-slate-500"
                            )}
                          >
                            {escrow.status.replace("_", " ")}
                          </Badge>
                          <span className="text-sm font-bold font-heading text-primary ml-1">
                            ${(escrow.totalAmountUsd || escrow.amount || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {escrow.status === "funded" ? (
                          <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl px-4 font-bold text-xs uppercase tracking-widest">
                            <Play className="h-3 w-3 mr-2" />
                            START
                          </Button>
                        ) : (
                          <Link href="/verification">
                            <Button size="sm" variant="outline" className="rounded-xl px-4 font-bold text-xs uppercase tracking-widest border-slate-200">
                              SUBMIT PROOF
                            </Button>
                          </Link>
                        )}
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          STEP {escrow.totalMilestonesCompleted}/{escrow.totalMilestones}
                        </span>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden h-full">
            <CardHeader className="bg-slate-50/30 border-b border-border/50">
              <CardTitle className="font-heading text-lg">Analytic Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-white/40 border border-border/50 rounded-2xl group hover:bg-white transition-all">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Protocol Success</span>
                  <span className="text-xl font-bold text-emerald-600 font-heading">98.4%</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/40 border border-border/50 rounded-2xl group hover:bg-white transition-all">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Avg. Confidence</span>
                  <span className="text-xl font-bold text-blue-600 font-heading">
                    {stats?.averageVerificationScore ? Math.round(stats.averageVerificationScore * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/40 border border-border/50 rounded-2xl group hover:bg-white transition-all">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Epoch Total</span>
                  <span className="text-xl font-bold text-slate-900 font-heading">{workerEscrows.length} Jobs</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-200 mt-6 group overflow-hidden relative">
                  <div className="relative z-10">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Reputation Score</span>
                    <div className="flex items-center mt-1">
                      <span className="text-2xl font-bold font-heading mr-2">4.92</span>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="text-amber-400 text-sm">★</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Shield className="absolute -right-2 -bottom-2 h-20 w-20 text-white/5 rotate-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      </div>
    </div>
  )
}