# Arc Verified Escrow Backend

Express + TypeScript backend for a human-only Arc-based escrow platform with:

- jobs and milestone management
- human worker and client profiles
- reputation scoring
- submission intake
- GenLayer verification adapter support
- milestone release workflow
- PostgreSQL persistence via Prisma
- a real Solidity escrow contract plus Arc deploy scripts

## Scripts

- `npm install`
- `npm run prisma:generate`
- `npm run db:push`
- `npm run contracts:build`
- `npm run contracts:build:genlayer`
- `npm run contracts:lint`
- `npm run contracts:deploy:arc`
- `npm run contracts:deploy:genlayer`
- `npm run dev`
- `npm run build`
- `npm run smoke:live`
- `npm start`

## Database setup

1. Copy `.env.example` to `.env`
2. Point `DATABASE_URL` at a running PostgreSQL instance
3. Run `npm run prisma:generate`
4. Run `npm run db:push`

On startup the API seeds the initial client and worker profiles if they do not already exist.

## Arc contract flow

The repo now includes a real native-token escrow contract in `contracts/src/ArcEscrow.sol`.

To build the contract:

1. Set `ARC_RPC_URL` and `ARC_RELAYER_PRIVATE_KEY` in `.env`
2. Run `npm run contracts:build`
3. Run `npm run contracts:lint`

To deploy to Arc testnet:

1. Fund the relayer wallet on Arc testnet
2. Run `npm run contracts:deploy:arc`
3. Copy the deployed address into `ARC_ESCROW_CONTRACT_ADDRESS`

The backend exposes Arc helper routes and can now sync escrow creation and milestone release against that contract.

## GenLayer verifier flow

The repo also includes a deployable GenLayer intelligent contract package in `contracts/genlayer/`.

Files:

- `contracts/genlayer/src/__init__.py` - verifier intelligent contract
- `contracts/genlayer/runner.json` - package metadata
- `contracts/genlayer/requirements-dev.txt` - Python lint dependencies
- `scripts/contracts/build-genlayer.mjs` - bundle builder
- `scripts/contracts/deploy-genlayer.mjs` - deployment script

To deploy the GenLayer verifier:

1. Install Python lint dependencies with `py -m pip install -r contracts/genlayer/requirements-dev.txt`
2. Run `npm run contracts:build:genlayer`
3. Run `npm run contracts:lint`
4. Set `GENLAYER_RPC_URL` and `GENLAYER_PRIVATE_KEY` in `.env`
5. Set `GENLAYER_ALLOWED_DOMAINS` in `.env` if you want proof-link domain restrictions
6. Run `npm run contracts:deploy:genlayer`
7. Copy the deployed address into `GENLAYER_VERIFIER_CONTRACT_ADDRESS`

The default verifier entrypoint is `verify_submission` and it accepts the backend's current JSON-string payload mode.

The backend now fetches and sanitizes proof-link content before sending it to GenLayer, so the verifier can inspect real proof excerpts on Bradbury without relying on unsupported in-contract webpage fetch helpers.

The live Bradbury deployment can be smoke-tested with `npm run smoke:live`. That flow creates a tiny escrow job, funds it on Arc, submits a proof through the HTTP API, verifies it through GenLayer, and releases the approved milestone on Arc.

A CI-friendly manual workflow is available at `.github/workflows/live-smoke.yml`. It provisions PostgreSQL, runs `npm run db:push`, builds the project, and executes the same live smoke flow. Configure these repository secrets before using it:

- `ARC_RELAYER_PRIVATE_KEY`
- `GENLAYER_PRIVATE_KEY`
- `GENLAYER_ACCOUNT_ADDRESS`

## Arc nanopayments

The backend now includes a first Arc nanopayments surface using Circle Gateway and `x402`.

Environment:

- `NANOPAYMENTS_SELLER_ADDRESS` - seller EOA that receives Gateway-settled funds
- `NANOPAYMENTS_NETWORKS` - accepted CAIP-2 networks, default `eip155:5042002` for Arc Testnet
- `NANOPAYMENTS_FACILITATOR_URL` - Circle Gateway facilitator URL, default testnet `https://gateway-api-testnet.circle.com`
- `NANOPAYMENTS_PREMIUM_PREVIEW_PRICE_USD` - paid route price, default `0.000001`

Routes:

- `GET /nanopayments` - current nanopayments config and price
- `POST /premium/verification-preview` - x402-protected premium verification preview endpoint

This does not replace milestone escrow. It adds a usage-based payment rail alongside escrow so you can charge for premium API actions while keeping milestone custody and release on the escrow contract.

## Core routes

- `GET /health`
- `GET /actors`
- `GET /actors/:actorId`
- `GET /jobs`
- `POST /jobs`
- `GET /jobs/:jobId`
- `POST /jobs/:jobId/milestones/:milestoneId/submissions`
- `POST /jobs/:jobId/milestones/:milestoneId/release`
- `GET /verifications`

## Notes

This version persists data with Prisma and PostgreSQL. GenLayer integration is still adapter-based and depends on your verifier endpoint configuration.
