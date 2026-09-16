# Contributing to Autopayze

## Prerequisites

- Node.js 22+
- pnpm 9+
- a Supabase project
- a Stellar Testnet wallet for local validation

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

## Testing

```bash
pnpm test
pnpm typecheck
pnpm lint
```

## Branching

- feature/* for new functionality
- fix/* for bug fixes
- chore/* for maintenance

## Pull requests

- keep changes focused and reviewable
- document any security or wallet-impacting changes
- prefer small, concrete commits over broad rewrites

## Project architecture

- app/ contains routes and top-level app shells
- components/ contains reusable UI and layout primitives
- lib/ contains auth, validation, and service abstractions
- providers/ contains app-wide behavior that needs context
- agents/ is reserved for AI orchestration and provider abstraction

## Security expectations

- never store private keys or seed phrases in the repo
- never expose service-role keys in client code
- never let AI tools directly execute transactions
