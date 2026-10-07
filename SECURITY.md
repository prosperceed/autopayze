# Security Policy

## Core principles

**Non-custodial:** Autopayze does not hold user private keys. Users sign all transactions with their own Stellar wallet. The app reads public wallet metadata and validates transaction intent before user approval.

**AI boundary enforcement:** The AI agent parses user intent and produces structured transaction output, but never executes transactions or accesses private keys. All execution requires deterministic application code and explicit user approval.

**No secret exposure:** Service-role keys, private keys, and Groq API keys are server-only. Client-side code never accesses secrets; all secrets are prefixed and excluded from public bundles.

## Vulnerability disclosure

If you discover a security issue:

1. **Do not open a public issue or pull request.**
2. Email `security@autopayze.com` with:
   - Vulnerability title and type (e.g., replay, front-running, key leakage)
   - Detailed reproduction steps and affected version
   - Proof of concept (code snippet or testnet tx hash) if safe to share
   - Your preferred contact method and publication timeline

3. **SLA:**
   - Acknowledgment within 24 hours
   - Initial assessment within 7 days
   - Patch release within 14 days of confirmation
   - Public disclosure coordinated with your timeline after fix deployment

## Severity classification

| Severity     | Impact                                       | Example                                                   | SLA          |
| ------------ | -------------------------------------------- | --------------------------------------------------------- | ------------ |
| **Critical** | Loss of funds or key material                | Private key leaked, replay attack, fund theft             | 24–72 hours  |
| **High**     | Account compromise or transaction censorship | Auth bypass, CORS misconfiguration, sequence reuse        | 3–7 days     |
| **Medium**   | Denial of service or data exposure           | Rate limit bypass, unencrypted state, information leakage | 7–14 days    |
| **Low**      | Upgrade recommended; no immediate risk       | Outdated dependency, weak logging, documentation error    | Next release |

## Environment secrets

- Never commit `.env.local` or any `.env.*` file containing secrets
- Use `git-secrets` hook to prevent accidental commits
- Rotate secrets immediately if exposed
- Keep `SUPABASE_SERVICE_ROLE_KEY` and `GROQ_API_KEY` server-only
- Prefix public env vars with `NEXT_PUBLIC_` only; all others are server-only

## Transaction authorization

Before any on-chain submission:

1. **Intent validation:** AI output is parsed and type-checked against `Payment`, `Airdrop`, or `Schedule` schemas
2. **Account validation:** Horizon confirms sender exists and has sufficient balance
3. **Preview:** User sees full transaction details (destination, amount, fee, timebounds) in the UI
4. **Wallet signature:** User's wallet (Freighter, Albedo, etc.) signs the transaction; Autopayze never holds the signature key
5. **Submission:** Signed transaction is submitted via Horizon; no relay or custody

## Key management practices

- User keys are managed by their wallet; Autopayze requests signatures only
- Session tokens are rotated on auth refresh; tokens expire after 1 hour of inactivity
- Admin keys (if used for testnet operations) are rotated quarterly and stored in a 1Password vault
- All cryptographic operations are tested against industry vectors; no custom crypto

## Testing security changes

- All auth and wallet-state changes must include unit tests
- Transaction construction changes must test against testnet before PR merge
- Replay and fee exhaustion tests are required for payment/schedule features
- Use `npm audit` in CI to catch dependency vulnerabilities

## Acknowledgments

We credit responsible security researchers in a public SECURITY_CREDITS.md file after fix deployment.

Thank you for helping secure Autopayze and the Stellar ecosystem.
