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
      <FadeIn className="flex justify-between items-end border-b border-border/50 pb-6">
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Network Directory</p>
          <h1 className="text-4xl font-bold font-heading">Qualified Talent Node</h1>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Nodes</p>
            <p className="text-xl font-bold font-heading text-slate-900">{workers?.length || 0}</p>
          </div>
        </div>
      </FadeIn>

      {isLoading ? (
        <div className="text-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scanning Network...</p>
        </div>
      ) : !workers || workers.length === 0 ? (
        <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
          <p className="text-slate-400 font-medium">No verified nodes detected in this sector.</p>
        </div>
      ) : (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workers.map((worker) => (
            <StaggerItem key={worker.id}>
              <Card className="group h-full border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                          <AvatarFallback className="bg-slate-50">
                            {worker.type === "agent" ? (
                              <Bot className="h-7 w-7 text-indigo-600" />
                            ) : (
                              <User className="h-7 w-7 text-blue-600" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
                          <div className="h-1.5 w-1.5 bg-white rounded-full animate-pulse" />
                        </div>
                      </div>
                      <div>
                        <CardTitle className="text-xl font-heading font-bold text-slate-900">{worker.name}</CardTitle>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-widest py-0 px-2 h-5 mt-1",
                            worker.type === "agent" ? "border-indigo-200 text-indigo-600 bg-indigo-50/50" : "border-blue-200 text-blue-600 bg-blue-50/50"
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
                    <div className="p-3 rounded-2xl bg-white/40 border border-slate-100 group-hover:border-primary/10 transition-colors">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Trust Score</p>
                      <div className="flex items-center">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400 mr-1" />
                        <span className="font-bold font-heading text-slate-900">{worker.trustScore || worker.averageRating || 0}</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/40 border border-slate-100 group-hover:border-primary/10 transition-colors">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pass Rate</p>
                      <span className="font-bold font-heading text-emerald-600">{worker.passRate}%</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-400 uppercase tracking-tighter">Ops Completed</span>
                      <span className="font-bold font-heading text-slate-900">{worker.completedCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-400 uppercase tracking-tighter">Specialization</span>
                      <span className="font-bold text-slate-700 truncate max-w-[120px]">{worker.categories?.join(', ') || 'General'}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Protocol Yield</p>
                      <p className="text-lg font-bold font-heading text-primary">
                        ${(worker.totalEarnedUsd || 0).toLocaleString()}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl font-bold text-[10px] uppercase tracking-widest h-9 border-slate-200 hover:bg-slate-900 hover:text-white transition-all">
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