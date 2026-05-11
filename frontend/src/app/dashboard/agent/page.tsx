"use client"

import { StatusCard } from "@/components/status-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bot, DollarSign, Clock, Shield, Users, Zap, CheckCircle } from "lucide-react"
import { useEscrows, useDashboardStats } from "@/lib/hooks"
import { EscrowStateMachine } from "@/lib/escrow"
import { StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper"

export default function AgentDashboardPage() {
  const { data: allEscrows } = useEscrows()
  const { data: stats } = useDashboardStats()

  // Filter escrows for current agent
  const currentUserId = "w1" // Mock - in real app from auth (agent worker)
  const agentEscrows = allEscrows?.filter(e => e.workerId === currentUserId) || []

  // Calculate agent-specific stats
  const activeJobs = agentEscrows.filter(e => e.status === "in_progress").length
  const automatedTasks = agentEscrows.filter(e => e.status === "in_progress").length // Mock - tasks being processed
  const completedJobs = agentEscrows.filter(e => e.status === "released").length
  const totalEarnings = agentEscrows
    .filter(e => e.status === "released")
    .reduce((sum, e) => sum + (e.totalAmountUsd || e.amount || 0), 0)

  // AI-specific metrics
  const avgVerificationScore = stats?.averageVerificationScore || 0
  const automationRate = 95 // Mock - percentage of automated work

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 border-b border-border/50 pb-6">
        <div>
          <p className="eyebrow mb-1">Autonomous Layer</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold gradient-heading">AI Agent Dashboard</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20">
            <Bot className="h-3 w-3 mr-1" />
            AI Agent Active
          </Badge>
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10">
            <Zap className="h-3 w-3 mr-1" />
            Auto-processing
          </Badge>
        </div>
      </div>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StaggerItem>
          <StatusCard
            title="Active Jobs"
            value={String(activeJobs)}
            status="success"
            icon={<Bot className="h-4 w-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatusCard
            title="Auto-Processing"
            value={String(automatedTasks)}
            status="success"
            icon={<Zap className="h-4 w-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatusCard
            title="AI Accuracy"
            value={`${Math.round(avgVerificationScore * 100)}%`}
            status="success"
            icon={<Shield className="h-4 w-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatusCard
            title="Total Earnings"
            value={`$${totalEarnings.toLocaleString()}`}
            status="success"
            icon={<DollarSign className="h-4 w-4" />}
          />
        </StaggerItem>
      </StaggerContainer>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-heading">Agent Operations</CardTitle>
          </CardHeader>
          <CardContent>
            {agentEscrows.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No active operations</p>
                <p className="text-sm">New escrows will be automatically processed</p>
              </div>
            ) : (
              <StaggerContainer className="space-y-4">
                {agentEscrows.slice(0, 3).map((escrow) => (
                  <StaggerItem key={escrow.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-border/50 rounded-xl hover:bg-accent/40 transition-colors bg-muted/30">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{escrow.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        Client: {escrow.clientId}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge
                          variant={
                            escrow.status === "in_progress"
                              ? "default"
                              : escrow.status === "awaiting_verification"
                              ? "secondary"
                              : escrow.status === "released"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {escrow.status.replace("_", " ")}
                        </Badge>
                        {escrow.status === "in_progress" && (
                          <Badge variant="outline" className="border-blue-500/30 text-blue-700 dark:text-blue-400 bg-blue-500/10">
                            <Zap className="h-3 w-3 mr-1" />
                            Processing
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Milestones: {escrow.totalMilestonesCompleted}/{escrow.totalMilestones}
                      </div>
                    </div>
                    <div className="sm:text-right shrink-0">
                      <div className="text-sm font-medium font-heading text-primary">
                        ${(escrow.totalAmountUsd || escrow.amount || 0).toLocaleString()}
                      </div>
                      {escrow.status === "in_progress" && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Auto-processing active
                        </div>
                      )}
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-heading">AI Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium text-muted-foreground">Automation Rate</span>
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400 font-heading">{automationRate}%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium text-muted-foreground">Avg. Verification Score</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400 font-heading">
                  {Math.round(avgVerificationScore * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium text-muted-foreground">Tasks Completed</span>
                <span className="text-lg font-bold text-foreground font-heading">{completedJobs}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium text-muted-foreground">Processing Speed</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-heading">2.3s avg</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium text-muted-foreground">Error Rate</span>
                <span className="text-lg font-bold text-rose-600 dark:text-rose-400 font-heading">0.1%</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-blue-900 dark:text-blue-200">Agent Status</span>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                AI agent is online and processing tasks autonomously.
                All verifications are handled automatically with 95%+ accuracy.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}