/**
 * Transaction Context
 * Manages transaction state and confirmation flows
 * Frontend-only: Prepared for backend swap
 */

"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import type { TransactionType, TransactionContextType, TransactionState } from "./types"

const TransactionContext = createContext<TransactionContextType | undefined>(undefined)

const initialState: TransactionState = {
  status: "idle",
  data: null,
  confirmations: 0,
}

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transaction, setTransaction] = useState<TransactionState>(initialState)

  const initiate = useCallback(async (type: TransactionType, escrowId: string, amount?: number) => {
    setTransaction({
      status: "pending",
      data: { type, escrowId, amount },
      confirmations: 0,
      estimatedFee: "0.05",
    })

    // Simulate transaction submission delay
    await new Promise((resolve) => setTimeout(resolve, 500))
  }, [])

  const confirm = useCallback(async () => {
    if (transaction.status !== "pending") return

    setTransaction((prev) => ({
      ...prev,
      status: "confirming",
      confirmations: 0,
    }))

    try {
      // Simulate confirmation blocks
      for (let i = 1; i <= 3; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setTransaction((prev) => ({
          ...prev,
          confirmations: i,
        }))
      }

      // Mock transaction hash - in real implementation, backend provides this
      const mockHash = "0x" + Math.random().toString(16).slice(2, 66)

      setTransaction((prev) => ({
        ...prev,
        status: "success",
        data: prev.data ? { ...prev.data, hash: mockHash } : null,
      }))
    } catch (error) {
      setTransaction((prev) => ({
        ...prev,
        status: "error",
        data: prev.data ? {
          ...prev.data,
          error: error instanceof Error ? error.message : "Transaction failed",
        } : null,
      }))
    }
  }, [transaction.status])

  const cancel = useCallback(() => {
    setTransaction(initialState)
  }, [])

  const reset = useCallback(() => {
    setTransaction(initialState)
  }, [])

  const value: TransactionContextType = {
    transaction,
    initiate,
    confirm,
    cancel,
    reset,
  }

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  )
}

export function useTransaction() {
  const context = useContext(TransactionContext)
  if (context === undefined) {
    throw new Error("useTransaction must be used within TransactionProvider")
  }
  return context
}
