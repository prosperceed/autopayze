# Autopayze

Autopayze is a powerful tool designed to automate financial transactions on the Stellar network, enhancing user experience and operational efficiency.

## Current status

This repository is the foundation milestone for the project. It includes:

- Next.js 16 app shell and responsive authenticated navigation
- Supabase Auth integration and SSR session setup
- Login, signup, onboarding, protected routes, and admin gate
- Stellar-oriented types and validation boundaries
- Wallet connection state abstraction and wrong-network protection
- Empty or placeholder states for features not yet implemented

The project intentionally does not fake backend execution. If a feature is not implemented, it is modeled as an empty state or an abstraction with clear future responsibilities.

## Architecture

The structure separates responsibilities between frontend UI, auth, wallet state, Stellar validation, and future backend/agent layers.

- app/: routes, layouts, landing page, auth callback, protected app shell, admin shell
- components/: reusable UI, layout, wallet UI, authentication, marketing primitives
- lib/: auth, Supabase SSR, Stellar validation and client
- providers/: wallet provider and app state boundaries
- agents/: future AI orchestration/provider schemas and tools
- supabase/: database migrations and schema expectations
- tests/: validation and boundary tests

## Tech stack

- Next.js 16 + App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth + SSR
- Stellar JavaScript SDK
- Zod validation
- Vitest
- pnpm

## Installation

To install Autopayze, clone the repository and run:

```bash
npm install
```

## Usage

After installation, you can start the application with:

```bash
npm start
```

## Environment variables

See .env.example for the current contract:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- GROQ_API_KEY
- NEXT_PUBLIC_STELLAR_NETWORK
- NEXT_PUBLIC_STELLAR_HORIZON_URL
- NEXT_PUBLIC_STELLAR_SOROBAN_RPC_URL
- SUPABASE_SERVICE_ROLE_KEY (server-only)

Never expose private keys, service-role keys, or Groq keys to client-side code.

## Supabase setup

1. Create a Supabase project.
2. Set project URL and publishable key in .env.local.
3. Run the migration in supabase/migrations/0001_profiles_and_roles.sql.
4. Configure auth providers for Google and GitHub.
5. In Supabase Auth > URL Configuration > Redirect URLs, add both:
   - `http://localhost:3000/auth/callback`
   - `https://*.app.github.dev/auth/callback`

The auth buttons use the browser's current origin, so localhost redirects back
to localhost and a Codespaces forwarded port redirects back to that Codespaces
URL. When using a specific forwarded URL, add its exact callback URL as well if
your Supabase project does not accept the wildcard pattern.

## Google OAuth

In Supabase Auth > Providers > Google:

- Enable Google sign-in
- Add your app URL and callback domain
- Use the redirect URL pattern from your Supabase dashboard

## GitHub OAuth

In Supabase Auth > Providers > GitHub:

- Enable GitHub sign-in
- Add the app callback URL configured in Supabase

## Stellar Testnet

This milestone is intentionally pinned to Stellar Testnet by default. The app checks the wallet network before enabling payment workflows. Wallets connected to the wrong network show a warning state rather than silently assuming safety.

## Stellar Integration

Autopayze uses the Stellar JavaScript SDK and Horizon API to validate accounts, read balances, and construct transactions before submission to a user's wallet for signing. All transaction building respects Stellar's native sequence management, timebounds, and fee strategy.

### Quickstart: Testnet setup

1. Set network to Testnet:

   ```bash
   NEXT_PUBLIC_STELLAR_NETWORK=testnet
   NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
   NEXT_PUBLIC_STELLAR_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
   ```

2. Fund a testnet account via [Friendbot](https://developers.stellar.org/docs/tutorials/create-account):

   ```bash
   curl "https://friendbot.stellar.org?addr=GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
   ```

3. Connect any testnet wallet (e.g., Freighter, Albedo) in the app.

### On-chain patterns

**Sequence management:** Autopayze reads the account's current sequence from Horizon and increments it locally for each transaction in a batch. If submission fails, the sequence is not reused.

**Timebounds:** All scheduled payments include `minTime` (epoch when scheduled) and `maxTime` (epoch + buffer). This prevents replay and enforces execution windows.

**Claimable balances:** Airdrops use claimable balances to allow recipients to claim tokens without requiring pre-funded accounts. Each claimable balance has a unique claim ID and optional predicate.

**Transaction fees:** Fee is calculated at build time using the network's current base fee (typically 100 stroops). For sponsored transactions, the sponsoring account signs separately.

### Example: Build and submit a scheduled payment

See [src/lib/schedule-service.ts](src/lib/schedule-service.ts) for the full pattern:

```typescript
// Read current sequence from Horizon
const account = await horizon.loadAccount(accountId);

// Build transaction with timebounds
const transaction = new TransactionBuilder(account, {
	fee: BASE_FEE,
	networkPassphrase: Networks.TESTNET_NETWORK_PASSPHRASE,
	timebounds: { minTime: scheduledTime, maxTime: scheduledTime + 3600 },
})
	.addOperation(
		Operation.payment({
			destination: recipientAddress,
			asset: Asset.native(),
			amount: "10.00",
		}),
	)
	.build();

// User's wallet signs; app does not hold keys
const signed = await wallet.signTransaction(transaction);
await horizon.submitTransaction(signed);
```

### Testing on testnet

Run the integration test suite against testnet:

```bash
pnpm test:stellar
```

Tests fund temporary accounts, submit test transactions, and verify they appear in Horizon within finality (3–5 seconds).

## Security

This codebase does not store private keys or trust AI-generated transaction instructions. All blockchain execution remains behind deterministic app logic and user approval.

## CI/CD

GitHub Actions runs on every push to `main` and `develop`:

- **lint** — ESLint and code style checks
- **typecheck** — TypeScript strict mode
- **test** — Vitest unit tests
- **test:stellar** — Testnet integration tests (Horizon API, transaction submission)
- **audit** — Dependency vulnerability scan
- **build** — Production build verification

See [.github/workflows/ci.yml](.github/workflows/ci.yml) for the full pipeline.

## Monitoring and Operations

See [docs/RUNBOOK.md](docs/RUNBOOK.md) for troubleshooting scheduled payments, monitoring account state, and recovery procedures.

## Roadmap

- secure payment intent approval flow
- budget and policy enforcement
- scheduled payment engine
- AI provider abstraction and tool execution
- stable wallet persistence and profile data model
- admin operational tooling
- real execution verification and receipts

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on contributing to this project.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release notes and feature history.
