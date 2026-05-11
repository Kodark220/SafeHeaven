import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { CheckCircle, Clock, AlertTriangle, XCircle } from "lucide-react"
import { HoverCard } from "@/components/ui/motion-wrapper"

interface StatusCardProps {
  title: string
  value: string
  status?: "success" | "warning" | "error" | "pending"
  icon?: React.ReactNode
}

export function StatusCard({ title, value, status = "pending", icon }: StatusCardProps) {
  const statusConfig = {
    success: { icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 dark:bg-emerald-950/30" },
    warning: { icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10 dark:bg-amber-950/30" },
    error: { icon: XCircle, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10 dark:bg-rose-950/30" },
    pending: { icon: Clock, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10 dark:bg-blue-950/30" },
  }

  const config = statusConfig[status]
  const IconComponent = config.icon

  return (
    <HoverCard>
      <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium font-heading">{title}</CardTitle>
          <div className={cn("p-2 rounded-full", config.bg)}>
            {icon || <IconComponent className={cn("h-4 w-4", config.color)} />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-heading">{value}</div>
          <Badge variant={status === "success" ? "default" : status === "error" ? "destructive" : "secondary"} className="mt-2 font-medium">
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </CardContent>
      </Card>
    </HoverCard>
  )
}