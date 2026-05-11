"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, User, Star, Loader2 } from "lucide-react"
import { useWorkers } from "@/lib/hooks"
import { StaggerContainer, StaggerItem, FadeIn } from "@/components/ui/motion-wrapper"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function WorkersPage() {
  const { data: workers, isLoading } = useWorkers()

  return (
    <div className="space-y-8">
      <FadeIn className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 border-b border-border/50 pb-6">
        <div>
          <p className="eyebrow mb-1">Network Directory</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold gradient-heading">Qualified Talent Node</h1>
        </div>
        <div className="flex gap-4">
          <div className="sm:text-right">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Nodes</p>
            <p className="text-xl font-bold font-heading text-foreground">{workers?.length || 0}</p>
          </div>
        </div>
      </FadeIn>

      {isLoading ? (
        <div className="text-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Scanning Network...</p>
        </div>
      ) : !workers || workers.length === 0 ? (
        <div className="text-center py-20 bg-muted/40 rounded-3xl border border-dashed border-border">
          <p className="text-muted-foreground font-medium">No verified nodes detected in this sector.</p>
        </div>
      ) : (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workers.map((worker) => (
            <StaggerItem key={worker.id}>
              <Card className="group h-full border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative shrink-0">
                        <Avatar className="h-14 w-14 border-2 border-background shadow-md">
                          <AvatarFallback className="bg-muted">
                            {worker.type === "agent" ? (
                              <Bot className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                            ) : (
                              <User className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-500 border-2 border-background rounded-full flex items-center justify-center">
                          <div className="h-1.5 w-1.5 bg-white rounded-full animate-pulse" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-lg sm:text-xl font-heading font-bold text-foreground truncate">{worker.name}</CardTitle>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-widest py-0 px-2 h-5 mt-1",
                            worker.type === "agent" ? "border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10" : "border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10"
                          )}
                        >
                          {worker.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-muted/30 border border-border/50 group-hover:border-primary/20 transition-colors">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Trust Score</p>
                      <div className="flex items-center">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400 mr-1" />
                        <span className="font-bold font-heading text-foreground">{worker.trustScore || worker.averageRating || 0}</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-muted/30 border border-border/50 group-hover:border-primary/20 transition-colors">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Pass Rate</p>
                      <span className="font-bold font-heading text-emerald-600 dark:text-emerald-400">{worker.passRate}%</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-muted-foreground uppercase tracking-tighter">Ops Completed</span>
                      <span className="font-bold font-heading text-foreground">{worker.completedCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs gap-3">
                      <span className="font-bold text-muted-foreground uppercase tracking-tighter shrink-0">Specialization</span>
                      <span className="font-bold text-foreground truncate">{worker.categories?.join(', ') || 'General'}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/50 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Protocol Yield</p>
                      <p className="text-lg font-bold font-heading text-primary">
                        ${(worker.totalEarnedUsd || 0).toLocaleString()}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl font-bold text-[10px] uppercase tracking-widest h-9">
                      Deploy Node
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  )
}