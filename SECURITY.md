# Security

## Key principle

Autopayze is not a custodial wallet and does not hold user private keys. Users sign transactions with their own Stellar wallet. The application only reads public wallet metadata and validates transaction intent before approval.

## AI safety boundary

The AI layer can parse intent and produce structured output, but it must never directly execute a blockchain transaction or access private keys. That boundary is enforced by deterministic application code and explicit user approval.

## Environment secrets

- Do not commit .env.local
- Keep service-role keys and other secrets server-only
- Never prefix secret variables with NEXT_PUBLIC_

## Responsible disclosure

If you discover a vulnerability, contact the maintainers privately before publishing details publicly.

## Future transaction authorization model

Planned authorization controls include wallet policy validation, amount/schedule restrictions, recipient checks, preview confirmation, and secure execution verification before a transaction is submitted to the network.
