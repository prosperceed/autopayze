# Autopayze

Autopayze is a Stellar-first payment platform for AI-assisted payment intent orchestration, scheduled transfers, and wallet-based automation. The product is designed around a critical safety boundary: the AI may interpret requests and generate structured payment intents, but it never directly controls keys or executes financial transactions. Deterministic application code and explicit user approval remain the enforcement layer.

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

## Local development

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
3. Fill in your Supabase environment values.
4. Run the app:
   ```bash
   pnpm dev
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

## Security

This codebase does not store private keys or trust AI-generated transaction instructions. All blockchain execution remains behind deterministic app logic and user approval.

## Roadmap

- secure payment intent approval flow
- budget and policy enforcement
- scheduled payment engine
- AI provider abstraction and tool execution
- stable wallet persistence and profile data model
- admin operational tooling
- real execution verification and receipts
