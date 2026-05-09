"use client"

import Link from "next/link"
import { StatusCard } from "@/components/status-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, Clock, Shield, Users, Plus, Eye, ArrowRight, Zap } from "lucide-react"
import { useEscrows, useDashboardStats } from "@/lib/hooks"
import { EscrowStateMachine } from "@/lib/escrow"
import { StaggerContainer, StaggerItem, FadeIn } from "@/components/ui/motion-wrapper"
import { cn } from "@/lib/utils"

export default function ClientDashboardPage() {
  const { data: allEscrows } = useEscrows()
  const { data: stats } = useDashboardStats()

  // Filter escrows for current client
  const currentUserId = "c1" // Mock - in real app from auth
  const clientEscrows = allEscrows?.filter(e => e.clientId === currentUserId) || []

  // Calculate client-specific stats
  const activeEscrows = clientEscrows.filter(e => EscrowStateMachine.isActiveState(e.status)).length
  const completedEscrows = clientEscrows.filter(e => e.status === "released").length
  const totalValue = clientEscrows.reduce((sum, e) => sum + (e.totalAmountUsd || e.amount || 0), 0)
  const pendingVerification = clientEscrows.filter(e => e.status === "awaiting_verification").length

  return (
    <div className="space-y-8">
      <FadeIn className="flex justify-between items-end border-b border-border/50 pb-6">
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Client Portal</p>
          <h1 className="text-4xl font-extrabold font-heading tracking-tight bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Operations Center</h1>
        </div>
        <Link href="/dashboard/escrows/new">
          <Button className="font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-xl px-6 h-11 shadow-lg shadow-slate-200 uppercase tracking-wider text-xs">
            <Plus className="h-4 w-4 mr-2" />
            Launch Escrow
          </Button>
        </Link>
      </FadeIn>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StaggerItem>
          <StatusCard
            title="Managed Escrows"
            value={String(activeEscrows)}
            status="success"
            icon={<DollarSign className="h-4 w-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatusCard
            title="Completed Units"
            value={String(completedEscrows)}
            status="success"
            icon={<Clock className="h-4 w-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatusCard
            title="Pending Approval"
            value={String(pendingVerification)}
            status={pendingVerification > 0 ? "warning" : "success"}
            icon={<Shield className="h-4 w-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatusCard
            title="Committed Capital"
            value={`$${totalValue.toLocaleString()}`}
            status="success"
            icon={<Users className="h-4 w-4" />}
          />
        </StaggerItem>
      </StaggerContainer>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-8">
        <StaggerItem>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden h-full">
            <CardHeader className="bg-slate-50/30 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="font-heading text-lg">Active Portfolios</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {clientEscrows.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="font-medium">No escrow contracts detected</p>
                </div>
              ) : (
                <StaggerContainer className="space-y-4">
                  {clientEscrows.slice(0, 4).map((escrow) => (
                    <StaggerItem key={escrow.id} className="group flex items-center justify-between p-5 bg-white/40 border border-border/50 rounded-2xl hover:bg-white transition-all duration-300 hover:shadow-md">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900 font-heading leading-tight">{escrow.title}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          {escrow.description.substring(0, 50)}...
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-tight py-0 px-2 h-5",
                              EscrowStateMachine.isActiveState(escrow.status) ? "border-primary/20 text-primary bg-primary/5" : "border-slate-200 text-slate-500"
                            )}
                          >
                            {escrow.status.replace("_", " ")}
                          </Badge>
                          <span className="text-sm font-bold font-heading text-slate-900 ml-1">
                            ${(escrow.totalAmountUsd || escrow.amount || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-xl px-4 font-bold text-xs uppercase tracking-widest border-slate-200 hover:bg-slate-900 hover:text-white transition-all">
                        <Eye className="h-3.5 w-3.5 mr-2" />
                        DETAILS
                      </Button>
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
              <CardTitle className="font-heading text-lg">Protocol Quick-Access</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <StaggerContainer className="space-y-3">
                <StaggerItem>
                  <Link href="/dashboard/escrows/new">
                    <Button className="w-full justify-between h-12 px-5 bg-white/40 border border-border/50 hover:bg-white text-slate-700 font-bold rounded-2xl transition-all group" variant="outline">
                      <div className="flex items-center">
                        <div className="p-2 bg-slate-100 rounded-lg mr-3 group-hover:bg-primary/10 transition-colors">
                           <Plus className="h-4 w-4 text-slate-600 group-hover:text-primary" />
                        </div>
                        <span className="text-sm font-medium">Initiate New Contract</span>
                      </div>
                      <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Button>
                  </Link>
                </StaggerItem>
                <StaggerItem>
                  <Link href="/dashboard/client/milestones">
                    <Button className="w-full justify-between h-12 px-5 bg-white/40 border border-border/50 hover:bg-white text-slate-700 font-bold rounded-2xl transition-all group" variant="outline">
                      <div className="flex items-center">
                        <div className="p-2 bg-slate-100 rounded-lg mr-3 group-hover:bg-amber-100 transition-colors">
                           <Zap className="h-4 w-4 text-slate-600 group-hover:text-amber-600" />
                        </div>
                        <span className="text-sm font-medium">Audit Milestones ({pendingVerification})</span>
                      </div>
                      <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Button>
                  </Link>
                </StaggerItem>
                <StaggerItem>
                  <Link href="/verification">
                    <Button className="w-full justify-between h-12 px-5 bg-white/40 border border-border/50 hover:bg-white text-slate-700 font-bold rounded-2xl transition-all group" variant="outline">
                      <div className="flex items-center">
                        <div className="p-2 bg-slate-100 rounded-lg mr-3 group-hover:bg-blue-100 transition-colors">
                           <Shield className="h-4 w-4 text-slate-600 group-hover:text-blue-600" />
                        </div>
                        <span className="text-sm font-medium">Network Compliance</span>
                      </div>
                      <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Button>
                  </Link>
                </StaggerItem>
                <StaggerItem>
                  <Link href="/dashboard/workers">
                    <Button className="w-full justify-between h-12 px-5 bg-white/40 border border-border/50 hover:bg-white text-slate-700 font-bold rounded-2xl transition-all group" variant="outline">
                      <div className="flex items-center">
                        <div className="p-2 bg-slate-100 rounded-lg mr-3 group-hover:bg-emerald-100 transition-colors">
                           <Users className="h-4 w-4 text-slate-600 group-hover:text-emerald-600" />
                        </div>
                        <span className="text-sm font-medium">Qualified Talent Node</span>
                      </div>
                      <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Button>
                  </Link>
                </StaggerItem>
              </StaggerContainer>
            </CardContent>
          </Card>
        </StaggerItem>
      </div>
    </div>
  )
}