"use client"

import { StatusCard } from "@/components/status-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, Shield, Users, DollarSign, Activity, ArrowRight, Zap, Bot } from "lucide-react"
import { useDashboardStats, useRecentActivities, useRecentEscrows } from "@/lib/hooks"
import { EscrowStateMachine } from "@/lib/escrow"
import { StaggerContainer, StaggerItem, FadeIn } from "@/components/ui/motion-wrapper"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: activities, isLoading: activitiesLoading } =
    useRecentActivities(5)
  const { data: escrows, isLoading: escrowsLoading } = useRecentEscrows(4)

  // Calculate derived stats from escrow state engine
  const activeEscrowsCount = escrows?.filter(e => EscrowStateMachine.isActiveState(e.status)).length || 0

  return (
    <div className="space-y-10">
      <FadeIn className="flex flex-col gap-2 border-b border-border/50 pb-6">
        <p className="eyebrow">Network Overview</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold gradient-heading">Protocol Dashboard</h1>
        <p className="text-muted-foreground max-w-2xl mt-1">
          Real-time monitoring of decentralized escrows, AI-verification nodes, and automated settlement protocols.
        </p>
      </FadeIn>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StaggerItem>
          <StatusCard
            title="Active Protocol Units"
            value={statsLoading ? "..." : String(activeEscrowsCount)}
            status="success"
            icon={<Zap className="h-4 w-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatusCard
            title="Consensus Velocity"
            value={
              statsLoading
                ? "..."
                : `${stats?.milestonesCompleted || 0}/${stats?.totalMilestones || 0}`
            }
            status={
              stats && stats.milestonesCompleted === stats.totalMilestones
                ? "success"
                : "warning"
            }
            icon={<Clock className="h-4 w-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatusCard
            title="Oracle Confidence"
            value={
              statsLoading
                ? "..."
                : `${Math.round((stats?.averageVerificationScore || 0) * 100)}%`
            }
            status="success"
            icon={<Shield className="h-4 w-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatusCard
            title="Validator Nodes"
            value={statsLoading ? "..." : String(stats?.activeWorkers || 0)}
            status="success"
            icon={<Bot className="h-4 w-4" />}
          />
        </StaggerItem>
      </StaggerContainer>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8">
        <StaggerItem>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden h-full">
            <CardHeader className="surface-muted border-b border-border/50">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="font-heading text-lg font-bold text-foreground">Live Escrow Stream</CardTitle>
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest shrink-0">Real-time</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {escrowsLoading ? (
                <div className="py-20 text-center animate-pulse text-muted-foreground font-bold uppercase tracking-widest text-xs">Synchronizing...</div>
              ) : escrows && escrows.length > 0 ? (
                <StaggerContainer className="space-y-4">
                  {escrows.map((escrow) => (
                    <StaggerItem key={escrow.id} className="group flex items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-muted/30 border border-transparent hover:border-border hover:bg-accent/40 transition-all duration-300 hover:shadow-md">
                      <div className="space-y-1 min-w-0">
                        <p className="font-bold text-foreground font-heading leading-tight truncate">{escrow.title}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                          ID: {escrow.id.substring(0, 8)}...
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                           <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0 h-5">
                             {escrow.status.replace("_", " ").toUpperCase()}
                           </Badge>
                           <span className="text-sm font-bold font-heading text-primary">
                            ${(escrow.totalAmountUsd || escrow.amount || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="h-8 w-8 rounded-full border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                         <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              ) : (
                <div className="py-20 text-center text-muted-foreground font-medium">No protocol units detected</div>
              )}
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden h-full">
            <CardHeader className="surface-muted border-b border-border/50">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle className="font-heading text-lg font-bold text-foreground">Protocol Ledger</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {activitiesLoading ? (
                <div className="py-20 text-center animate-pulse text-muted-foreground font-bold uppercase tracking-widest text-xs">Fetching logs...</div>
              ) : activities && activities.length > 0 ? (
                <StaggerContainer className="space-y-6">
                  {activities.map((activity) => (
                    <StaggerItem key={activity.id} className="flex items-start gap-4 group">
                      <div className="mt-1 shrink-0">
                        {activity.type === "milestone_completed" ? (
                          <div className="p-2 bg-emerald-500/10 rounded-lg"><CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /></div>
                        ) : activity.type === "verification_passed" ? (
                          <div className="p-2 bg-blue-500/10 rounded-lg"><Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div>
                        ) : (
                          <div className="p-2 bg-muted rounded-lg"><DollarSign className="h-4 w-4 text-muted-foreground" /></div>
                        )}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <p className="text-sm font-bold text-foreground font-heading leading-tight">{activity.title}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {activity.description}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-tighter mt-1">
                          {new Date(activity.timestamp).toLocaleTimeString()} • {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              ) : (
                <div className="py-20 text-center text-muted-foreground font-medium">Log stream is currently empty</div>
              )}
            </CardContent>
          </Card>
        </StaggerItem>
      </div>
    </div>
  )
}