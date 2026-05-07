"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DollarSign,
  Play,
  CheckCircle,
  Shield,
  Send,
  AlertTriangle,
  Scale,
  X,
  Zap
} from "lucide-react"
import { useEscrowState, EscrowStateMachine, type EscrowAction } from "@/lib/escrow"
import type { Escrow } from "@/lib/types"
import { motion } from "framer-motion"
import { FadeIn } from "@/components/ui/motion-wrapper"
import { cn } from "@/lib/utils"

interface ActionPanelProps {
  escrow: Escrow
  currentUserId: string
  onAction?: (action: EscrowAction, params?: any) => void
  className?: string
}

export function ActionPanel({ escrow, currentUserId, onAction, className }: ActionPanelProps) {
  const {
    canTransition,
  } = useEscrowState(escrow.id)

  const isClient = currentUserId === escrow.clientId
  const isWorker = currentUserId === escrow.workerId

  const getActionButton = (
    action: EscrowAction,
    label: string,
    icon: React.ReactNode,
    variant: "default" | "secondary" | "destructive" | "outline" = "default",
    params?: any
  ) => {
    const validation = canTransition(action, params)
    const isEnabled = validation.valid

    return (
      <motion.div
        key={action}
        whileHover={isEnabled ? { scale: 1.02 } : {}}
        whileTap={isEnabled ? { scale: 0.98 } : {}}
      >
        <Button
          variant={variant}
          size="sm"
          disabled={!isEnabled}
          onClick={() => onAction?.(action, params)}
          className={cn(
            "flex items-center gap-2 h-10 px-4 font-bold rounded-xl transition-all",
            isEnabled && variant === "default" && "bg-slate-900 text-white hover:bg-slate-800 shadow-sm",
            !isEnabled && "opacity-50 grayscale cursor-not-allowed"
          )}
        >
          {icon}
          <span className="uppercase tracking-wider text-[10px]">{label}</span>
          {!isEnabled && (
            <Badge variant="outline" className="ml-1 text-[8px] h-4 py-0 font-bold border-slate-300">
              LOCK
            </Badge>
          )}
        </Button>
      </motion.div>
    )
  }

  const getAvailableActions = () => {
    const actions = []

    // Client actions
    if (isClient) {
      if (canTransition("fund").valid) {
        actions.push(
          getActionButton(
            "fund",
            "Fund Escrow",
            <DollarSign className="h-4 w-4" />,
            "default"
          )
        )
      }

      if (canTransition("open_dispute").valid) {
        actions.push(
          getActionButton(
            "open_dispute",
            "Open Dispute",
            <AlertTriangle className="h-4 w-4" />,
            "destructive"
          )
        )
      }

      if (canTransition("cancel").valid) {
        actions.push(
          getActionButton(
            "cancel",
            "Cancel Escrow",
            <X className="h-4 w-4" />,
            "outline"
          )
        )
      }
    }

    // Worker actions
    if (isWorker) {
      if (canTransition("start_work").valid) {
        actions.push(
          getActionButton(
            "start_work",
            "Start Work",
            <Play className="h-4 w-4" />
          )
        )
      }

      if (canTransition("request_verification").valid) {
        actions.push(
          getActionButton(
            "request_verification",
            "Request Verification",
            <CheckCircle className="h-4 w-4" />
          )
        )
      }

      if (canTransition("open_dispute").valid) {
        actions.push(
          getActionButton(
            "open_dispute",
            "Open Dispute",
            <AlertTriangle className="h-4 w-4" />,
            "destructive"
          )
        )
      }
    }

    // System/Admin actions (for verification and dispute resolution)
    if (canTransition("verify").valid) {
      actions.push(
        getActionButton(
          "verify",
          "Verify Work",
          <Shield className="h-4 w-4" />,
          "secondary"
        )
      )
    }

    if (canTransition("release_funds").valid) {
      actions.push(
        getActionButton(
          "release_funds",
          "Release Funds",
          <Send className="h-4 w-4" />
        )
      )
    }

    if (canTransition("resolve_dispute").valid) {
      actions.push(
        getActionButton(
          "resolve_dispute",
          "Resolve Dispute",
          <Scale className="h-4 w-4" />,
          "secondary"
        )
      )
    }

    return actions
  }

  const availableActions = getAvailableActions()
  const isTerminal = EscrowStateMachine.isTerminalState(escrow.status)

  return (
    <FadeIn>
      <Card className={cn("border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden", className)}>
        <CardHeader className="bg-slate-50/30 border-b border-border/50">
          <CardTitle className="text-lg flex items-center gap-2 font-heading">
            <Zap className="h-5 w-5 text-primary" />
            Control Center
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {availableActions.length === 0 && isTerminal ? (
            <div className="text-center py-6">
              <CheckCircle className="h-12 w-12 mx-auto text-emerald-500 mb-3 opacity-50" />
              <p className="text-sm font-bold text-slate-900 font-heading">Contract Finalized</p>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">
                Immutable state reached. No further operations permitted.
              </p>
            </div>
          ) : availableActions.length === 0 ? (
            <div className="text-center py-6">
              <Shield className="h-12 w-12 mx-auto text-slate-300 mb-3 opacity-50" />
              <p className="text-sm font-bold text-slate-900 font-heading">Actions Restricted</p>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">
                Awaiting counterparty response or oracle confirmation.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3">
                {availableActions}
              </div>
              <div className="flex items-center gap-2 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">
                  Actions context-aware based on current role: {isClient ? "CLIENT" : isWorker ? "WORKER" : "GUEST"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </FadeIn>
  )
}