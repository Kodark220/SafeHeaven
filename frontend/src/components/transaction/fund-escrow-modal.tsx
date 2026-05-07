"use client"

import { useState } from "react"
import { useTransaction } from "@/lib/transaction/context"
import { useUpdateEscrow } from "@/lib/hooks/useEscrows"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FundEscrowModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  escrowId: string
  escrowAmount: number
  escrowCurrency: string
}

export function FundEscrowModal({
  open,
  onOpenChange,
  escrowId,
  escrowAmount,
  escrowCurrency,
}: FundEscrowModalProps) {
  const { transaction, initiate, confirm, cancel, reset } = useTransaction()
  const { mutateAsync: updateEscrow } = useUpdateEscrow()
  const [fundAmount, setFundAmount] = useState(escrowAmount.toString())
  const [acceptTerms, setAcceptTerms] = useState(false)

  const isProcessing = transaction.status === "pending" || transaction.status === "confirming"
  const isSuccess = transaction.status === "success"
  const isError = transaction.status === "error"

  const handleInitiate = async () => {
    if (!acceptTerms) return
    await initiate("fund", escrowId, parseFloat(fundAmount))
  }

  const handleConfirm = async () => {
    await confirm()
    // Update escrow status in database
    if (transaction.data?.hash) {
      await updateEscrow({
        id: escrowId,
        data: { status: "funded" },
      })
    }
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fund Escrow</DialogTitle>
          <DialogDescription>
            Fund this escrow to start the work process
          </DialogDescription>
        </DialogHeader>

        {transaction.status === "idle" ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  id="amount"
                  type="number"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  disabled={isProcessing}
                  step="0.01"
                />
                <span className="px-3 py-2 text-sm font-medium text-muted-foreground">
                  {escrowCurrency}
                </span>
              </div>
            </div>

            {transaction.estimatedFee && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <div className="flex justify-between">
                  <span>Estimated Gas Fee:</span>
                  <span className="font-medium">{transaction.estimatedFee} {escrowCurrency}</span>
                </div>
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">
                I accept the escrow terms and conditions
              </span>
            </label>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleInitiate}
                disabled={!acceptTerms || !fundAmount}
              >
                Proceed to Funding
              </Button>
            </DialogFooter>
          </div>
        ) : null}

        {transaction.status === "pending" ? (
          <div className="space-y-4 py-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
            <div className="text-center">
              <p className="font-medium">Preparing transaction</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please sign the transaction in your wallet
              </p>
            </div>
          </div>
        ) : null}

        {transaction.status === "confirming" ? (
          <div className="space-y-4 py-6">
            <div className="text-center">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2 animate-pulse" />
              <p className="font-medium">Confirming transaction</p>
              <p className="text-sm text-muted-foreground mt-1">
                Confirmations: {transaction.confirmations}/3
              </p>
              <div className="mt-4 w-full bg-muted rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(transaction.confirmations / 3) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ) : null}

        {transaction.status === "success" ? (
          <div className="space-y-4 py-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <p className="font-medium text-lg">Funding Successful</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your escrow has been funded
              </p>
              {transaction.data?.hash && (
                <p className="text-xs font-mono text-muted-foreground mt-3 break-all">
                  {transaction.data.hash}
                </p>
              )}
            </div>
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        ) : null}

        {transaction.status === "error" ? (
          <div className="space-y-4 py-6">
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                {transaction.data?.error || "Transaction failed"}
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  reset()
                }}
                className="flex-1"
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
