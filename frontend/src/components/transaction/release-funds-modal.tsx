import React, { useState, useCallback } from "react"
import { useTransaction } from "@/lib/transaction"
import { useUpdateEscrow } from "@/lib/hooks/useEscrows"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
} from "lucide-react"

interface ReleaseFundsModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  escrowId: string
  escrowAmount: number
  workerAddress?: string
  escrowCurrency?: string
}

export function ReleaseFundsModal({
  isOpen,
  onOpenChange,
  escrowId,
  escrowAmount,
  workerAddress = "0x1234...5678",
  escrowCurrency = "USDC",
}: ReleaseFundsModalProps) {
  const transaction = useTransaction()
  const updateEscrowMutation = useUpdateEscrow()

  const [releaseAmount, setReleaseAmount] = useState<string>(escrowAmount.toString())
  const [termsAccepted, setTermsAccepted] = useState(false)

  const handleRelease = useCallback(async () => {
    if (!releaseAmount || parseFloat(releaseAmount) <= 0) {
      alert("Please enter a valid amount")
      return
    }

    if (!termsAccepted) {
      alert("Please accept the terms and conditions")
      return
    }

    try {
      // Initiate transaction
      await transaction.initiate("release", escrowId, parseFloat(releaseAmount))

      // Confirm transaction (simulates blockchain confirmation)
      await transaction.confirm()

      // Update escrow status to "released"
      await updateEscrowMutation.mutateAsync({
        id: escrowId,
        data: {
          status: "released" as any,
        },
      })

      // Reset form after success
      setReleaseAmount(escrowAmount.toString())
      setTermsAccepted(false)
    } catch (error) {
      console.error("Release failed:", error)
    }
  }, [releaseAmount, termsAccepted, transaction, escrowId, escrowAmount, updateEscrowMutation])

  const handleClose = () => {
    if (transaction.transaction.status !== "pending" && transaction.transaction.status !== "confirming") {
      transaction.reset()
      setReleaseAmount(escrowAmount.toString())
      setTermsAccepted(false)
      onOpenChange(false)
    }
  }

  const isLoading = transaction.transaction.status === "pending" || transaction.transaction.status === "confirming"
  const isSuccess = transaction.transaction.status === "success"
  const isError = transaction.transaction.status === "error"

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Release Funds</DialogTitle>
          <DialogDescription>
            Complete the transaction to release escrow funds to the worker
          </DialogDescription>
        </DialogHeader>

        {/* Idle State - Form */}
        {transaction.transaction.status === "idle" && (
          <div className="space-y-4">
            {/* Worker Address Display */}
            <div>
              <Label className="text-xs text-muted-foreground">Recipient Address</Label>
              <div className="p-3 bg-muted rounded-lg text-sm font-mono">
                {workerAddress}
              </div>
            </div>

            {/* Release Amount */}
            <div>
              <Label htmlFor="release-amount">Release Amount ({escrowCurrency})</Label>
              <div className="flex gap-2">
                <Input
                  id="release-amount"
                  type="number"
                  placeholder="0.00"
                  value={releaseAmount}
                  onChange={(e) => setReleaseAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  disabled={isLoading}
                />
                <Button
                  variant="outline"
                  onClick={() => setReleaseAmount(escrowAmount.toString())}
                  disabled={isLoading}
                >
                  Max
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Available: {escrowAmount} {escrowCurrency}
              </p>
            </div>

            {/* Estimated Gas Fee */}
            <div className="p-3 bg-muted rounded-lg text-sm">
              <div className="flex justify-between">
                <span>Estimated Gas Fee:</span>
                <span className="font-medium">0.05 {escrowCurrency}</span>
              </div>
            </div>

            {/* Terms Acceptance */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-muted-foreground">
                I confirm releasing funds to the worker
              </span>
            </label>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRelease}
                disabled={!termsAccepted || isLoading || !releaseAmount}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Release Funds"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Pending State - Processing */}
        {transaction.transaction.status === "pending" && (
          <div className="space-y-4 py-8 text-center">
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Initiating transaction...
            </p>
          </div>
        )}

        {/* Confirming State - Waiting for Confirmation */}
        {transaction.transaction.status === "confirming" && (
          <div className="space-y-4 py-8">
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Confirming Transaction</p>
              <p className="text-xs text-muted-foreground mt-2">
                Block {transaction.transaction.confirmations} of 3
              </p>
            </div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full ${
                    i < transaction.transaction.confirmations
                      ? "bg-primary"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Success State */}
        {isSuccess && (
          <div className="space-y-4 py-8">
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <div className="text-center space-y-2">
              <p className="font-medium">Funds Released Successfully!</p>
              <p className="text-sm text-muted-foreground">
                {releaseAmount} {escrowCurrency} sent to worker
              </p>
            </div>
            {transaction.transaction.data?.hash && (
              <div className="p-3 bg-muted rounded-lg break-all text-xs font-mono">
                <p className="text-muted-foreground mb-1">Transaction Hash:</p>
                <p>{transaction.transaction.data.hash}</p>
              </div>
            )}
            <Button
              onClick={() => {
                transaction.reset()
                onOpenChange(false)
              }}
              className="w-full"
            >
              Close
            </Button>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="space-y-4 py-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {transaction.transaction.data?.error || "Transaction failed"}
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  transaction.reset()
                  setReleaseAmount(escrowAmount.toString())
                }}
                className="flex-1"
              >
                Retry
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
