"use client"

import React, { useState } from "react"
import { useEscrows } from "@/lib/hooks"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, Briefcase, DollarSign, Clock, ArrowRight, Shield } from "lucide-react"
import { StaggerContainer, StaggerItem, FadeIn } from "@/components/ui/motion-wrapper"
import { cn } from "@/lib/utils"

export default function MarketplacePage() {
  const { data: escrows, isLoading } = useEscrows()
  const [searchTerm, setSearchTerm] = useState("")

  // Filter for funded/draft escrows that workers can browse
  const availableEscrows = escrows?.filter(e => 
    (e.status === "funded" || e.status === "draft") &&
    (e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
     e.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <FadeIn className="flex flex-col gap-2 border-b border-border/50 pb-6">
        <p className="eyebrow">Global Network</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold gradient-heading">
          Service Marketplace
        </h1>
        <p className="text-muted-foreground max-w-2xl mt-1">
          Browse available escrow contracts and claim verification tasks.
        </p>
      </FadeIn>

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 md:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks, skills, or keywords..."
            className="pl-10 rounded-xl h-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="rounded-xl h-11 font-bold text-xs uppercase tracking-widest px-5">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="py-20 text-center animate-pulse text-muted-foreground font-bold uppercase tracking-widest text-xs">
          Scanning network for opportunities...
        </div>
      ) : availableEscrows.length === 0 ? (
        <div className="text-center py-20 bg-muted/40 rounded-3xl border border-dashed border-border">
          <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground/60" />
          <p className="font-bold text-foreground font-heading text-lg">No active contracts found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or check back later.</p>
        </div>
      ) : (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {availableEscrows.map((escrow) => (
            <StaggerItem key={escrow.id}>
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden hover:shadow-lg transition-all duration-300 group rounded-3xl h-full flex flex-col">
                <CardHeader className="surface-muted border-b border-border/50 p-4 sm:p-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <CardTitle className="font-heading text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors truncate">
                        {escrow.title}
                      </CardTitle>
                      <CardDescription className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {escrow.description}
                      </CardDescription>
                    </div>
                    <Badge className="shrink-0 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-bold uppercase tracking-widest text-[10px] py-0.5 px-2 h-5">
                      Available
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4 flex-1 flex flex-col">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center text-sm text-muted-foreground min-w-0">
                      <div className="p-2 bg-muted rounded-lg mr-3 shrink-0">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Yield</p>
                        <p className="font-bold font-heading text-foreground truncate">
                          ${(escrow.totalAmountUsd || escrow.amount || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground min-w-0">
                      <div className="p-2 bg-muted rounded-lg mr-3 shrink-0">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Deadline</p>
                        <p className="font-bold font-heading text-foreground truncate">3 Days</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-2 flex flex-wrap justify-between items-center gap-3 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shield className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-xs font-bold text-muted-foreground">AI Verified</span>
                    </div>
                    <Button size="sm" className="rounded-xl font-bold text-xs uppercase tracking-widest">
                      Apply Now
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
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
