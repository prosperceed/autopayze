# Contributing to Autopayze

We welcome contributions to Autopayze! Please follow these guidelines to ensure a smooth collaboration.

## Coding Standards

- Follow the existing code style and conventions.
- Write clear, concise commit messages.
- Ensure code is well-documented.

## Pull Request Process

1. Fork the repository and create your branch from `main`.
2. Make your changes and ensure they pass existing tests.
3. Submit a pull request with a clear description of your changes.

## Issue Reporting

- Before reporting an issue, check if it has already been reported.
- Provide detailed information about the issue, including steps to reproduce and any relevant logs.

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

- feature/\* for new functionality
- fix/\* for bug fixes
- chore/\* for maintenance

## Pull requests

- Keep changes focused and reviewable
- Document any security or wallet-impacting changes
- Prefer small, concrete commits over broad rewrites
- Add tests for new on-chain workflows; use `.test.ts` co-located with source
- Update CHANGELOG.md with user-facing changes (features, breaking changes, security fixes)

### PR template

```markdown
## Description

Brief summary of changes.

## Type

- [ ] Feature
- [ ] Bug fix
- [ ] Security fix
- [ ] Refactor
- [ ] Docs

## Wallet/transaction impact?

- [ ] No
- [ ] Yes (describe)

## Testing

Steps to verify, testnet account requirements.

## Checklist

- [ ] Tests pass: `pnpm test`
- [ ] Linting passes: `pnpm lint`
- [ ] Types check: `pnpm typecheck`
- [ ] No secrets in commits
```

## Project architecture

- `app/` contains routes and top-level app shells
- `components/` contains reusable UI and layout primitives
- `lib/` contains auth, validation, and service abstractions (e.g., Stellar SDK patterns)
- `providers/` contains app-wide behavior that needs context
- `agents/` is reserved for AI orchestration and provider abstraction
- `supabase/` contains schema migrations and server functions

## On-chain contribution guidelines

- All Stellar SDK usage must validate account state before building transactions
- Never construct transactions without a valid sequence from Horizon
- Always set explicit timebounds; do not rely on default infinite bounds
- Test against testnet before opening a PR; include testnet tx hashes in commit message if relevant
- Document any new fee, sequence, or claimable-balance patterns in a comment or commit message

## Security expectations

- Never store private keys or seed phrases in the repo
- Never expose service-role keys in client code
- Never let AI tools directly execute transactions; all execution requires explicit user approval
- All cryptographic operations must be unit tested and reviewed
- If modifying auth or wallet state, notify maintainers in the PR description
