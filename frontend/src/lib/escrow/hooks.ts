/**
 * Escrow State Management Hook
 *
 * React hook that integrates the Escrow State Engine with TanStack Query
 * for managing escrow state transitions and validation.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  EscrowStateMachine,
  EscrowValidators,
  EscrowBlockchainHelpers,
  type EscrowAction,
  type ValidationResult
} from "@/lib/escrow"
import { useEscrows, useUpdateEscrow } from "@/lib/hooks"
import type { Escrow } from "@/lib/types"

export interface EscrowTransitionParams {
  fundingTxHash?: string
  verifierId?: string
  releaseTxHash?: string
  disputeReason?: string
  disputeInitiator?: string
  resolution?: string
  arbitratorId?: string
  cancelReason?: string
}

/**
 * Hook for managing escrow state transitions
 */
export function useEscrowState(escrowId: string) {
  const queryClient = useQueryClient()
  const { data: escrows } = useEscrows()
  const updateEscrowMutation = useUpdateEscrow()

  const escrow = escrows?.find(e => e.id === escrowId)

  /**
   * Check if a transition is valid
   */
  const canTransition = (
    action: EscrowAction,
    params?: EscrowTransitionParams
  ): ValidationResult => {
    if (!escrow) {
      return { valid: false, errors: ["Escrow not found"] }
    }

    return EscrowStateMachine.canTransition(escrow, action, params)
  }

  /**
   * Get possible transitions from current state
   */
  const getPossibleTransitions = () => {
    if (!escrow) return []
    return EscrowStateMachine.getPossibleTransitions(escrow.status)
  }

  /**
   * Execute a state transition
   */
  const transitionMutation = useMutation({
    mutationFn: async ({
      action,
      params
    }: {
      action: EscrowAction
      params?: EscrowTransitionParams
    }) => {
      if (!escrow) {
        throw new Error("Escrow not found")
      }

      const validation = EscrowStateMachine.canTransition(escrow, action, params)
      if (!validation.valid) {
        throw new Error(`Transition validation failed: ${validation.errors.join(", ")}`)
      }

      const result = EscrowStateMachine.transition(escrow, action, params)
      if (!result.success || !result.newStatus) {
        throw new Error(`Transition failed: ${result.errors.join(", ")}`)
      }

      await updateEscrowMutation.mutateAsync({
        id: escrowId,
        data: {
          status: result.newStatus,
          updatedAt: new Date(),
          ...(action === "open_dispute" && params?.disputeReason && {
            disputeReason: params.disputeReason
          }),
          ...(action === "resolve_dispute" && params?.resolution && {
            disputeResolution: params.resolution
          }),
          ...(action === "cancel" && params?.cancelReason && {
            cancelledReason: params.cancelReason
          })
        }
      })

      return result.newStatus
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["escrows"] })
      queryClient.invalidateQueries({ queryKey: ["escrow", escrowId] })
    }
  })

  const fundEscrow = useMutation({
    mutationFn: async (fundingTxHash: string) => {
      return transitionMutation.mutateAsync({
        action: "fund",
        params: { fundingTxHash }
      })
    }
  })

  const startWork = useMutation({
    mutationFn: async () => {
      return transitionMutation.mutateAsync({ action: "start_work" })
    }
  })

  const requestVerification = useMutation({
    mutationFn: async () => {
      return transitionMutation.mutateAsync({ action: "request_verification" })
    }
  })

  const verifyEscrow = useMutation({
    mutationFn: async (verifierId: string) => {
      return transitionMutation.mutateAsync({
        action: "verify",
        params: { verifierId }
      })
    }
  })

  const releaseFunds = useMutation({
    mutationFn: async (releaseTxHash: string) => {
      return transitionMutation.mutateAsync({
        action: "release_funds",
        params: { releaseTxHash }
      })
    }
  })

  const openDispute = useMutation({
    mutationFn: async (params: { disputeReason: string; disputeInitiator: string }) => {
      return transitionMutation.mutateAsync({
        action: "open_dispute",
        params: {
          disputeReason: params.disputeReason,
          disputeInitiator: params.disputeInitiator
        }
      })
    }
  })

  const resolveDispute = useMutation({
    mutationFn: async (params: { resolution: string; arbitratorId: string }) => {
      return transitionMutation.mutateAsync({
        action: "resolve_dispute",
        params: {
          resolution: params.resolution,
          arbitratorId: params.arbitratorId
        }
      })
    }
  })

  const cancelEscrow = useMutation({
    mutationFn: async (cancelReason: string) => {
      return transitionMutation.mutateAsync({
        action: "cancel",
        params: { cancelReason }
      })
    }
  })

  return {
    escrow,
    canTransition,
    getPossibleTransitions,
    transition: transitionMutation,

    fundEscrow,
    startWork,
    requestVerification,
    verifyEscrow,
    releaseFunds,
    openDispute,
    resolveDispute,
    cancelEscrow,

    isTerminalState: escrow ? EscrowStateMachine.isTerminalState(escrow.status) : false,
    isActiveState: escrow ? EscrowStateMachine.isActiveState(escrow.status) : false
  }
}

/**
 * Hook for escrow blockchain helpers
 */
export function useEscrowBlockchain() {
  const getContractParams = (escrow: Escrow) =>
    EscrowBlockchainHelpers.generateContractParams(escrow)

  const getFundingData = (escrow: Escrow) =>
    EscrowBlockchainHelpers.generateFundingTxData(escrow)

  const getMilestoneTxData = (
    escrowId: string,
    milestoneId: string,
    proofUrl?: string
  ) => EscrowBlockchainHelpers.generateMilestoneCompletionTxData(escrowId, milestoneId, proofUrl)

  const getReleaseTxData = (escrowId: string) =>
    EscrowBlockchainHelpers.generateReleaseTxData(escrowId)

  return {
    getContractParams,
    getFundingData,
    getMilestoneTxData,
    getReleaseTxData,
  }
}

/**
 * Hook for escrow validation helpers
 */
export function useEscrowValidation() {
  const validateCreation = (
    clientId: string,
    workerId: string,
    amount: number,
    milestones: any[]
  ): ValidationResult => {
    return EscrowValidators.validateEscrowCreation(clientId, workerId, amount, milestones)
  }

  const validateMilestoneCompletion = (
    escrow: Escrow,
    milestoneId: string,
    proofUrl?: string
  ): ValidationResult => {
    return EscrowValidators.validateMilestoneCompletion(escrow, milestoneId, proofUrl)
  }

  const validateFunding = (
    escrow: Escrow,
    fundedAmount: number,
    currency: string
  ): ValidationResult => {
    return EscrowValidators.validateFunding(escrow, fundedAmount, currency)
  }

  const validateDisputeInitiation = (
    escrow: Escrow,
    initiatorId: string,
    reason: string
  ): ValidationResult => {
    return EscrowValidators.validateDisputeInitiation(escrow, initiatorId, reason)
  }

  return {
    validateCreation,
    validateMilestoneCompletion,
    validateFunding,
    validateDisputeInitiation,
  }
}
