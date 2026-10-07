# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Stellar integration documentation with quickstart, on-chain patterns, and testnet examples
- GitHub Actions CI pipeline for lint, typecheck, unit tests, integration tests, and security audit
- Comprehensive runbook for monitoring and troubleshooting scheduled payments
- Security policy with vulnerability disclosure SLA (24-hour acknowledgment, 7-day assessment, 14-day patch)
- Severity classification matrix for security issues tied to Stellar-specific risks
- PR template with wallet/transaction impact tracking
- On-chain contribution guidelines for Stellar SDK usage (sequence validation, timebounds, testnet requirements)
- Enhanced SECURITY.md with transaction authorization flow and key management practices

### Changed

- Updated README with detailed Stellar integration section including Horizon API patterns
- Expanded CONTRIBUTING.md with test requirements, PR checklist, and on-chain guidelines
- Refactored SECURITY.md for clarity and added formal disclosure process with contact email

### Deprecated

- Legacy environment variable documentation (superseded by .env.example)

## [0.1.0] - 2026-10-07

### Added

- Foundation milestone: Next.js 16 app shell with Supabase Auth and SSR
- Wallet connection state management with Stellar network validation
- Protected routes and admin gate
- Stellar-oriented types and Zod validation boundaries
- Empty/placeholder states for unimplemented features
- Supabase schema migrations for profiles, auth, transactions, and scheduled payments
- AI agent scaffolding for intent parsing and transaction planning
- Vitest suite with boundary tests
- Tailwind CSS and responsive UI components

### Security

- Non-custodial architecture; users sign all transactions with their own wallet
- AI boundary enforcement; agent output requires explicit user approval before execution
- Server-only secrets; no exposure of private keys, seed phrases, or service-role keys in client code

---

## How to contribute

### Reporting bugs

- Check [GitHub Issues](https://github.com/yourorg/autopayze/issues) for duplicates
- Include reproduction steps, affected version, and testnet tx hash if applicable
- For security issues, see [SECURITY.md](SECURITY.md)

### Submitting changes

- Fork and create a feature branch: `git checkout -b feature/your-feature`
- Write tests and ensure `pnpm test && pnpm lint && pnpm typecheck` pass
- Reference any related issues in commit message
- Submit a pull request with a clear description and wallet-impact assessment

### Release process

1. Update version in `package.json` (follow semver)
2. Add entry to `CHANGELOG.md` under `[Unreleased]` → `[X.Y.Z] - YYYY-MM-DD`
3. Commit: `git commit -m "chore: release vX.Y.Z"`
4. Tag: `git tag vX.Y.Z`
5. Push: `git push origin main && git push origin vX.Y.Z`
6. GitHub Actions will build and publish automatically
