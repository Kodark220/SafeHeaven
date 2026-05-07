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
    success: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900" },
    warning: { icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900" },
    error: { icon: XCircle, color: "text-red-600", bg: "bg-red-100 dark:bg-red-900" },
    pending: { icon: Clock, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900" },
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