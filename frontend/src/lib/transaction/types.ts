/**
 * Transaction Types
 * Frontend-only transaction state management
 */

export type TransactionType = "fund" | "release" | "verify" | "dispute" | "resolve"
export type TransactionStatus = "idle" | "pending" | "confirming" | "success" | "error"

export interface TransactionData {
  type: TransactionType
  escrowId: string
  amount?: number
  hash?: string
  error?: string
}

export interface TransactionState {
  status: TransactionStatus
  data: TransactionData | null
  confirmations: number
  estimatedFee?: string
}

export interface TransactionContextType {
  transaction: TransactionState
  initiate(type: TransactionType, escrowId: string, amount?: number): Promise<void>
  confirm(): Promise<void>
  cancel(): void
  reset(): void
}
