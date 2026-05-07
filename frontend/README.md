# Arc Ecrow

Arc Ecrow is a Next.js escrow platform prototype for client-worker engagements, built with TypeScript, Tailwind CSS, shadcn/ui, and TanStack Query. It demonstrates a complete milestone workflow, AI verification layer, and a state-driven escrow lifecycle designed for easy backend and blockchain integration.

## Project Overview

This repository implements a frontend-first escrow application with:

- role-based dashboard views for clients and workers
- milestone submission and review flows
- AI verification score simulation
- escrow lifecycle state transitions
- query-driven data flow with mock API adapters
- a modular architecture for backend integration

## Escrow Lifecycle State Machine

The escrow lifecycle is modeled in `src/lib/escrow/state-engine.ts` with the following states:

- `draft` → initial creation
- `funded` → funds deposited and escrow activated
- `in_progress` → work has started
- `awaiting_verification` → milestones complete and verification pending
- `approved` → verification passed and ready for release
- `released` → funds released to worker
- `disputed` / `dispute_resolved` / `cancelled` → exceptional flows

Transitions are validated with guard and validator functions, making it easy to integrate a backend or blockchain adapter that enforces the same rules.

## Milestone Workflow System

Milestones live in `src/lib/types/index.ts` and now include a submission object to capture worker uploads:

- `submission.files` → uploaded proof files
- `submission.notes` → worker notes
- `submission.submittedAt` → submission timestamp
- `aiScore` → verification score
- `status` transitions through:
  - `pending_verification`
  - `awaiting_client_review`
  - `approved` / `rejected` / `disputed`

`src/lib/escrow/ai-verification.ts` contains a mock `runAiVerification()` function. It sets a pass/fail result and score based on submitted files and notes, and can be replaced with a real AI service integration.

## Dashboard Architecture

Dashboard routes are organized under `src/app/dashboard/`:

- `dashboard/client` → client overview and milestone review
- `dashboard/worker` → worker overview and submission workflow
- `dashboard/escrows/new` → escrow creation

Shared page layout is handled by `src/app/dashboard/layout.tsx`, and route protection is implemented via `src/components/route-guards.tsx`.

## API Layer Structure

The mock API layer is located in `src/lib/api/`:

- `src/lib/api/index.ts` → exports API adapters
- `src/lib/api/mock-data.ts` → seed data for workers, escrows, milestones, verifications

This layer is intentionally built as a swap-in point for a real backend. Replace the mock adapter methods with HTTP requests or RPC calls while retaining the same function signatures.

## Hooks Layer Responsibilities

The hooks layer in `src/lib/hooks/` contains reusable data access patterns:

- `useEscrows.ts` → escrow list, detail, creation, update
- `useMilestones.ts` → milestone list, detail, submission, status updates
- `useDashboard.ts` → dashboard statistics
- `useVerification.ts` → verification helpers
- `useWorkers.ts` → worker data

Hooks use TanStack Query for caching, invalidation, and mutation workflows. This structure allows backend engineers to connect the UI to real APIs with minimal changes.

## Blockchain Adapter Preparation

The repository is prepared for blockchain integration with a state-engine module and placeholders for transaction-based transitions.

- `src/lib/escrow/state-engine.ts` defines escrow actions, guards, and validators
- `src/lib/escrow/ai-verification.ts` simulates verification logic

A future blockchain adapter should:

1. map escrow actions to on-chain transactions
2. validate state transitions using the same rules
3. update the mock API layer or backend service with transaction metadata

## Backend Integration Expectations

A backend engineer can fork this repo and integrate by:

1. replacing `src/lib/api/mock-data.ts` with real data access
2. swapping `src/lib/api/index.ts` exports to call real backend endpoints
3. keeping the frontend hook signatures unchanged for minimal refactor
4. mapping milestone submission files to storage/upload services
5. enforcing state-engine validation on the backend and/or blockchain
6. integrating auth and user context with real identity services

## Folder Structure

- `src/app/` — Next.js App Router pages and layouts
- `src/components/` — reusable UI components, route guards, escrow UI pieces
- `src/lib/` — types, API adapters, auth, escrow state machine, verification logic, hooks
- `src/providers/` — shared React context providers for auth, theme, wallet, transaction state

## Setup Instructions

```bash
npm install
```

Then run the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Local Development Instructions

- Start the Next.js dev server with `npm run dev`
- Use mock authentication provided in `src/lib/auth/context.tsx` for local development
- Review worker functionality at `/dashboard/worker`
- Review client milestone approval at `/dashboard/client/milestones`
- Create new escrows at `/dashboard/escrows/new`

## Future Roadmap

- integrate a real backend API and replace mock API adapter
- add authenticated user sessions and role-based backend auth
- store uploaded milestone files in object storage
- integrate a real AI verification service
- connect escrow transitions to blockchain transactions
- support multi-chain payment release and dispute arbitration
- add webhook/events for escrow lifecycle changes
