import type { Escrow } from "@/lib/types"

/**
 * Escrow State Engine for Arc Blockchain Escrow Platform
 *
 * Defines the complete lifecycle of escrow contracts with strict state transitions,
 * validation guards, and blockchain-ready execution logic.
 */

export type EscrowStatus =
  | "draft"           // Initial state - escrow created but not funded
  | "funded"          // Funds deposited and escrow activated
  | "in_progress"     // Work started, milestones being completed
  | "awaiting_verification"  // All milestones complete, waiting for final verification
  | "approved"        // Verification passed, ready for release
  | "released"        // Funds released to worker
  | "disputed"        // Dispute opened by either party
  | "dispute_resolved" // Dispute resolved by arbitration
  | "cancelled"       // Escrow cancelled before completion

export type EscrowAction =
  | "fund"
  | "start_work"
  | "complete_milestone"
  | "request_verification"
  | "verify"
  | "release_funds"
  | "open_dispute"
  | "resolve_dispute"
  | "cancel"

export interface EscrowTransition {
  from: EscrowStatus
  to: EscrowStatus
  action: EscrowAction
  guard?: (escrow: any) => boolean
  validator?: (escrow: any, params?: any) => ValidationResult
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings?: string[]
}

/**
 * Escrow State Machine
 * Manages all state transitions with validation and guards
 */
export class EscrowStateMachine {
  private static readonly transitions: EscrowTransition[] = [
    // Draft → Funded
    {
      from: "draft",
      to: "funded",
      action: "fund",
      validator: (escrow, params) => {
        const errors: string[] = []

        if (!params?.fundingTxHash) {
          errors.push("Funding transaction hash required")
        }

        if (escrow.amount <= 0) {
          errors.push("Escrow amount must be greater than 0")
        }

        if (escrow.milestones.length === 0) {
          errors.push("At least one milestone required")
        }

        return {
          valid: errors.length === 0,
          errors
        }
      }
    },

    // Funded → In Progress
    {
      from: "funded",
      to: "in_progress",
      action: "start_work",
      guard: (escrow) => escrow.totalMilestones > 0,
      validator: (escrow) => {
        const errors: string[] = []

        if (escrow.totalMilestones === 0) {
          errors.push("Cannot start work without milestones")
        }

        return {
          valid: errors.length === 0,
          errors
        }
      }
    },

    // In Progress → Awaiting Verification (when all milestones complete)
    {
      from: "in_progress",
      to: "awaiting_verification",
      action: "request_verification",
      guard: (escrow) => escrow.totalMilestonesCompleted === escrow.totalMilestones,
      validator: (escrow) => {
        const errors: string[] = []

        if (escrow.totalMilestonesCompleted !== escrow.totalMilestones) {
          errors.push("All milestones must be completed before verification")
        }

        return {
          valid: errors.length === 0,
          errors
        }
      }
    },

    // Awaiting Verification → Approved
    {
      from: "awaiting_verification",
      to: "approved",
      action: "verify",
      validator: (escrow, params) => {
        const errors: string[] = []

        if (!params?.verifierId) {
          errors.push("Verifier ID required")
        }

        // Check if all verifications are passed
        const failedVerifications = escrow.verifications.filter(
          (v: any) => v.status === "failed"
        )

        if (failedVerifications.length > 0) {
          errors.push(`${failedVerifications.length} verifications failed`)
        }

        // Check average AI score
        const avgScore = escrow.verifications.reduce(
          (sum: number, v: any) => sum + v.aiScore,
          0
        ) / escrow.verifications.length

        if (avgScore < 0.8) {
          errors.push(`Average verification score too low: ${(avgScore * 100).toFixed(1)}%`)
        }

        return {
          valid: errors.length === 0,
          errors
        }
      }
    },

    // Approved → Released
    {
      from: "approved",
      to: "released",
      action: "release_funds",
      validator: (escrow, params) => {
        const errors: string[] = []

        if (!params?.releaseTxHash) {
          errors.push("Release transaction hash required")
        }

        return {
          valid: errors.length === 0,
          errors
        }
      }
    },

    // Any active state → Disputed
    {
      from: "funded",
      to: "disputed",
      action: "open_dispute",
      validator: (escrow, params) => {
        const errors: string[] = []

        if (!params?.disputeReason) {
          errors.push("Dispute reason required")
        }

        if (!params?.disputeInitiator) {
          errors.push("Dispute initiator required")
        }

        return {
          valid: errors.length === 0,
          errors
        }
      }
    },
    {
      from: "in_progress",
      to: "disputed",
      action: "open_dispute",
      validator: (escrow, params) => {
        const errors: string[] = []

        if (!params?.disputeReason) {
          errors.push("Dispute reason required")
        }

        if (!params?.disputeInitiator) {
          errors.push("Dispute initiator required")
        }

        return {
          valid: errors.length === 0,
          errors
        }
      }
    },
    {
      from: "awaiting_verification",
      to: "disputed",
      action: "open_dispute",
      validator: (escrow, params) => {
        const errors: string[] = []

        if (!params?.disputeReason) {
          errors.push("Dispute reason required")
        }

        if (!params?.disputeInitiator) {
          errors.push("Dispute initiator required")
        }

        return {
          valid: errors.length === 0,
          errors
        }
      }
    },
    {
      from: "approved",
      to: "disputed",
      action: "open_dispute",
      validator: (escrow, params) => {
        const errors: string[] = []

        if (!params?.disputeReason) {
          errors.push("Dispute reason required")
        }

        if (!params?.disputeInitiator) {
          errors.push("Dispute initiator required")
        }

        return {
          valid: errors.length === 0,
          errors
        }
      }
    },

    // Disputed → Dispute Resolved
    {
      from: "disputed",
      to: "dispute_resolved",
      action: "resolve_dispute",
      validator: (escrow, params) => {
        const errors: string[] = []

        if (!params?.resolution) {
          errors.push("Dispute resolution required")
        }

        if (!params?.arbitratorId) {
          errors.push("Arbitrator ID required")
        }

        return {
          valid: errors.length === 0,
          errors
        }
      }
    },

    // Draft/Funded → Cancelled
    {
      from: "draft",
      to: "cancelled",
      action: "cancel",
      validator: (escrow, params) => {
        const errors: string[] = []

        if (!params?.cancelReason) {
          errors.push("Cancellation reason required")
        }

        return {
          valid: errors.length === 0,
          errors
        }
      }
    },
    {
      from: "funded",
      to: "cancelled",
      action: "cancel",
      validator: (escrow, params) => {
        const errors: string[] = []

        if (!params?.cancelReason) {
          errors.push("Cancellation reason required")
        }

        // Only allow cancellation if no work has started
        if (escrow.totalMilestonesCompleted > 0) {
          errors.push("Cannot cancel escrow with completed milestones")
        }

        return {
          valid: errors.length === 0,
          errors
        }
      }
    }
  ]

  /**
   * Get all possible transitions from current status
   */
  static getPossibleTransitions(currentStatus: EscrowStatus): EscrowTransition[] {
    return this.transitions.filter(t => t.from === currentStatus)
  }

  /**
   * Check if a transition is valid
   */
  static canTransition(
    escrow: Escrow,
    action: EscrowAction,
    params?: any
  ): ValidationResult {
    const transition = this.transitions.find(
      t => t.from === escrow.status && t.action === action
    )

    if (!transition) {
      return {
        valid: false,
        errors: [`Invalid transition: ${escrow.status} → ${action}`]
      }
    }

    // Check guard condition
    if (transition.guard && !transition.guard(escrow)) {
      return {
        valid: false,
        errors: [`Guard condition failed for ${action}`]
      }
    }

    // Run validator
    if (transition.validator) {
      return transition.validator(escrow, params)
    }

    return { valid: true, errors: [] }
  }

  /**
   * Execute a state transition
   */
  static transition(
    escrow: Escrow,
    action: EscrowAction,
    params?: any
  ): { success: boolean; newStatus?: EscrowStatus; errors: string[] } {
    const validation = this.canTransition(escrow, action, params)

    if (!validation.valid) {
      return { success: false, errors: validation.errors }
    }

    const transition = this.transitions.find(
      t => t.from === escrow.status && t.action === action
    )!

    return {
      success: true,
      newStatus: transition.to,
      errors: []
    }
  }

  /**
   * Get terminal states (no further transitions possible)
   */
  static getTerminalStates(): EscrowStatus[] {
    return ["released", "dispute_resolved", "cancelled"]
  }

  /**
   * Check if status is terminal
   */
  static isTerminalState(status: EscrowStatus): boolean {
    return this.getTerminalStates().includes(status)
  }

  /**
   * Get active states (work in progress)
   */
  static getActiveStates(): EscrowStatus[] {
    return ["funded", "in_progress", "awaiting_verification", "approved", "disputed"]
  }

  /**
   * Check if status is active
   */
  static isActiveState(status: EscrowStatus): boolean {
    return this.getActiveStates().includes(status)
  }
}

/**
 * Escrow State Validators
 * Additional validation functions for complex business logic
 */
export class EscrowValidators {
  /**
   * Validate milestone completion requirements
   */
  static validateMilestoneCompletion(
    escrow: Escrow,
    milestoneId: string,
    proofUrl?: string
  ): ValidationResult {
    const errors: string[] = []

    const milestone = escrow.milestones.find((m: any) => m.id === milestoneId)
    if (!milestone) {
      errors.push(`Milestone ${milestoneId} not found`)
      return { valid: false, errors }
    }

    if (milestone.status !== "awaiting_submission" && milestone.status !== "under_verification") {
      errors.push(`Milestone must be in progress to complete`)
    }

    const amountToRelease = milestone.amount || milestone.amountUsd || 0
    if (amountToRelease <= 0) {
      errors.push(`Milestone amount must be greater than 0`)
    }

    // Require proof for milestones over $1000
    if (amountToRelease > 1000 && !proofUrl) {
      errors.push(`Proof of work required for milestones over $1000`)
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Validate funding amount matches escrow requirements
   */
  static validateFunding(
    escrow: Escrow,
    fundedAmount: number,
    currency: string
  ): ValidationResult {
    const errors: string[] = []

    if (fundedAmount !== escrow.amount) {
      errors.push(`Funded amount ${fundedAmount} does not match escrow amount ${escrow.amount}`)
    }

    // Calculate total milestone amounts
    const totalMilestoneAmount = escrow.milestones.reduce(
      (sum: number, m: any) => sum + m.amount,
      0
    )

    if (totalMilestoneAmount !== escrow.amount) {
      errors.push(`Milestone amounts (${totalMilestoneAmount}) don't match escrow amount (${escrow.amount})`)
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Validate dispute initiation
   */
  static validateDisputeInitiation(
    escrow: Escrow,
    initiatorId: string,
    reason: string
  ): ValidationResult {
    const errors: string[] = []

    if (initiatorId !== escrow.clientId && initiatorId !== escrow.workerId) {
      errors.push(`Only client or worker can initiate dispute`)
    }

    if (!reason || reason.trim().length < 10) {
      errors.push(`Dispute reason must be at least 10 characters`)
    }

    if (escrow.status === "released") {
      errors.push(`Cannot dispute released escrow`)
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Validate escrow creation requirements
   */
  static validateEscrowCreation(
    clientId: string,
    workerId: string,
    amount: number,
    milestones: any[]
  ): ValidationResult {
    const errors: string[] = []

    if (!clientId || !workerId) {
      errors.push(`Client and worker IDs required`)
    }

    if (clientId === workerId) {
      errors.push(`Client and worker cannot be the same`)
    }

    if (amount <= 0) {
      errors.push(`Amount must be greater than 0`)
    }

    if (milestones.length === 0) {
      errors.push(`At least one milestone required`)
    }

    // Validate milestone amounts
    const totalMilestoneAmount = milestones.reduce(
      (sum: number, m: any) => sum + m.amount,
      0
    )

    if (totalMilestoneAmount !== amount) {
      errors.push(`Milestone amounts (${totalMilestoneAmount}) don't match escrow amount (${amount})`)
    }

    // Validate milestone order
    const sortedMilestones = [...milestones].sort((a, b) => a.order - b.order)
    for (let i = 0; i < sortedMilestones.length; i++) {
      if (sortedMilestones[i].order !== i + 1) {
        errors.push(`Milestone order must be sequential starting from 1`)
        break
      }
    }

    return { valid: errors.length === 0, errors }
  }
}

/**
 * Blockchain Integration Helpers
 * Functions to prepare escrow data for blockchain execution
 */
export class EscrowBlockchainHelpers {
  /**
   * Generate escrow contract parameters for blockchain deployment
   */
  static generateContractParams(escrow: Escrow): any {
    return {
      escrowId: escrow.id,
      client: escrow.clientId,
      worker: escrow.workerId,
      amount: escrow.amount,
      milestones: escrow.milestones.map(m => ({
        id: m.id,
        amount: m.amount || m.amountUsd,
        dueDate: Math.floor(new Date(m.dueDate).getTime() / 1000) // Unix timestamp
      })),
      totalMilestones: escrow.totalMilestones
    }
  }

  /**
   * Generate funding transaction data
   */
  static generateFundingTxData(escrow: Escrow): any {
    return {
      to: escrow.id, // Contract address
      value: escrow.amount,
      data: {
        action: "fund",
        escrowId: escrow.id
      }
    }
  }

  /**
   * Generate milestone completion transaction data
   */
  static generateMilestoneCompletionTxData(
    escrowId: string,
    milestoneId: string,
    proofUrl?: string
  ): any {
    return {
      to: escrowId,
      value: 0,
      data: {
        action: "completeMilestone",
        milestoneId,
        proofUrl
      }
    }
  }

  /**
   * Generate fund release transaction data
   */
  static generateReleaseTxData(escrowId: string): any {
    return {
      to: escrowId,
      value: 0,
      data: {
        action: "releaseFunds"
      }
    }
  }
}
