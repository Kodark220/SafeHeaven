# Escrow State Engine

The Escrow State Engine provides a robust, blockchain-ready state management system for escrow contracts on the Arc platform. It enforces strict lifecycle transitions with comprehensive validation and guards.

## Overview

The escrow lifecycle follows this strict progression:

```
draft → funded → in_progress → awaiting_verification → approved → released
    ↓                                                            ↓
cancelled                                                   dispute_resolved
    ↑                                                              ↑
    └────────────────── disputed ←─────────────────────────────────┘
```

## Core Components

### EscrowStateMachine

The central state management class that handles all transitions, validation, and guards.

```typescript
import { EscrowStateMachine } from "@/lib/escrow"

// Check if transition is valid
const validation = EscrowStateMachine.canTransition(escrow, "fund", {
  fundingTxHash: "0x..."
})

// Execute transition
const result = EscrowStateMachine.transition(escrow, "fund", {
  fundingTxHash: "0x..."
})
```

### EscrowValidators

Business logic validators for complex validation rules.

```typescript
import { EscrowValidators } from "@/lib/escrow"

// Validate escrow creation
const validation = EscrowValidators.validateEscrowCreation(
  clientId, workerId, amount, milestones
)

// Validate milestone completion
const validation = EscrowValidators.validateMilestoneCompletion(
  escrow, milestoneId, proofUrl
)
```

### EscrowBlockchainHelpers

Utilities for preparing blockchain transaction data.

```typescript
import { EscrowBlockchainHelpers } from "@/lib/escrow"

// Generate contract deployment parameters
const params = EscrowBlockchainHelpers.generateContractParams(escrow)

// Generate funding transaction
const txData = EscrowBlockchainHelpers.generateFundingTxData(escrow)
```

## React Hooks

### useEscrowState

React hook for managing escrow state transitions with TanStack Query integration.

```typescript
import { useEscrowState } from "@/lib/escrow"

function EscrowActions({ escrowId }: { escrowId: string }) {
  const {
    escrow,
    canTransition,
    fundEscrow,
    startWork,
    requestVerification,
    verifyEscrow,
    releaseFunds,
    openDispute,
    resolveDispute,
    cancelEscrow
  } = useEscrowState(escrowId)

  const handleFund = () => {
    fundEscrow.mutate("0x123...")
  }

  return (
    <div>
      {canTransition("fund").valid && (
        <button onClick={handleFund}>Fund Escrow</button>
      )}
    </div>
  )
}
```

### useEscrowValidation

Hook for validation helpers.

```typescript
import { useEscrowValidation } from "@/lib/escrow"

function CreateEscrowForm() {
  const { validateCreation } = useEscrowValidation()

  const handleSubmit = (data) => {
    const validation = validateCreation(
      data.clientId,
      data.workerId,
      data.amount,
      data.milestones
    )

    if (!validation.valid) {
      // Handle validation errors
      console.error(validation.errors)
      return
    }

    // Proceed with creation
  }
}
```

### useEscrowBlockchain

Hook for blockchain integration helpers.

```typescript
import { useEscrowBlockchain } from "@/lib/escrow"

function BlockchainIntegration({ escrow }: { escrow: Escrow }) {
  const {
    generateContractParams,
    generateFundingTxData,
    generateReleaseTxData
  } = useEscrowBlockchain()

  const deployContract = () => {
    const params = generateContractParams(escrow)
    // Deploy to blockchain
  }

  const fundEscrow = () => {
    const txData = generateFundingTxData(escrow)
    // Send transaction
  }
}
```

## State Definitions

### EscrowStatus

- `draft`: Initial state, escrow created but not funded
- `funded`: Funds deposited, escrow activated
- `in_progress`: Work started, milestones being completed
- `awaiting_verification`: All milestones complete, waiting for final verification
- `approved`: Verification passed, ready for release
- `released`: Funds released to worker
- `disputed`: Dispute opened by either party
- `dispute_resolved`: Dispute resolved by arbitration
- `cancelled`: Escrow cancelled before completion

### EscrowAction

- `fund`: Deposit funds into escrow
- `start_work`: Begin work on milestones
- `complete_milestone`: Mark milestone as complete (handled separately)
- `request_verification`: Request final verification when all milestones done
- `verify`: Perform final verification
- `release_funds`: Release funds to worker
- `open_dispute`: Open a dispute
- `resolve_dispute`: Resolve dispute via arbitration
- `cancel`: Cancel escrow

## Transition Rules

### Guards

Some transitions have guard conditions that must be met:

- `start_work`: Requires at least 1 milestone
- `request_verification`: Requires all milestones completed

### Validators

Each transition has validation logic:

- `fund`: Requires funding transaction hash, valid amount, milestones
- `verify`: Requires verifier ID, all verifications passed, minimum AI score
- `release_funds`: Requires release transaction hash
- `open_dispute`: Requires dispute reason and valid initiator
- `cancel`: Requires cancellation reason, no completed work for funded escrows

## Validation Examples

### Escrow Creation
```typescript
const validation = EscrowValidators.validateEscrowCreation(
  "client123",
  "worker456",
  5000,
  [
    { id: "m1", amount: 2000, order: 1 },
    { id: "m2", amount: 3000, order: 2 }
  ]
)
// Returns: { valid: true, errors: [] }
```

### Milestone Completion
```typescript
const validation = EscrowValidators.validateMilestoneCompletion(
  escrow,
  "milestone123",
  "https://proof.url"
)
// Checks: milestone exists, status is in-progress, proof required for >$1000
```

### Dispute Initiation
```typescript
const validation = EscrowValidators.validateDisputeInitiation(
  escrow,
  "client123",
  "Work quality unacceptable"
)
// Checks: valid initiator, sufficient reason length, escrow not released
```

## Blockchain Integration

The engine provides helpers for Arc blockchain escrow execution:

### Contract Deployment
```typescript
const contractParams = {
  escrowId: "e123",
  client: "0x123...",
  worker: "0x456...",
  amount: 5000,
  milestones: [
    { id: "m1", amount: 2000, dueDate: 1640995200 },
    { id: "m2", amount: 3000, dueDate: 1641081600 }
  ]
}
```

### Transaction Generation
```typescript
// Funding transaction
const fundTx = {
  to: "escrow_contract_address",
  value: 5000,
  data: {
    action: "fund",
    escrowId: "e123"
  }
}

// Milestone completion
const milestoneTx = {
  to: "escrow_contract_address",
  value: 0,
  data: {
    action: "completeMilestone",
    milestoneId: "m1",
    proofUrl: "https://proof.url"
  }
}
```

## Error Handling

All validation returns structured error information:

```typescript
interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings?: string[]
}
```

Use this for user feedback and error display:

```typescript
const validation = canTransition("fund", params)
if (!validation.valid) {
  validation.errors.forEach(error => {
    toast.error(error)
  })
}
```

## Best Practices

1. **Always validate before transitions**: Use `canTransition()` before executing actions
2. **Handle validation errors**: Display meaningful error messages to users
3. **Use appropriate hooks**: Leverage React hooks for state management integration
4. **Check terminal states**: Use `isTerminalState()` to disable actions on completed escrows
5. **Blockchain first**: Design for blockchain execution from the start
6. **Audit trail**: All transitions should be logged for transparency

## Future Extensions

The engine is designed to be extensible for:

- Custom transition rules per escrow type
- Additional validation logic
- Multi-party arbitration
- Time-based automatic transitions
- Integration with external oracles
- Cross-chain escrow support