"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock4, AlertTriangle, CheckCircle2, User } from "lucide-react"
import type { Escrow } from "@/lib/types"

interface DisputeTimelineProps {
  escrow: Escrow
}

export function DisputeTimeline({ escrow }: DisputeTimelineProps) {
  const events = [
    {
      label: "Escrow Created",
      description: `Draft created for ${escrow.title}`,
      date: escrow.createdAt,
      icon: <Clock4 className="h-4 w-4 text-slate-500" />,
    },
    escrow.disputeReason && {
      label: "Dispute Opened",
      description: escrow.disputeReason,
      date: escrow.updatedAt,
      icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
    },
    escrow.disputeResolution && {
      label: "Dispute Resolved",
      description: escrow.disputeResolution,
      date: escrow.updatedAt,
      icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    },
  ].filter(Boolean) as Array<{ label: string; description: string; date: Date; icon: React.ReactNode }>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dispute Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.map((event, index) => (
          <div key={event.label} className="grid gap-3 md:grid-cols-[auto_1fr]">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              {event.icon}
            </div>
            <div>
              <p className="font-semibold">{event.label}</p>
              <p className="text-sm text-muted-foreground">{event.description}</p>
              <p className="text-xs text-muted-foreground mt-1">{event.date.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
