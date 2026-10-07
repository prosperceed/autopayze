# Runbook: Monitoring and Troubleshooting Scheduled Payments

## Overview

This runbook covers monitoring scheduled payments in Autopayze, diagnosing failures, and recovery procedures. Scheduled payments execute on-chain; failures are typically due to insufficient balance, network issues, or sequence conflicts.

## Prerequisites

- Access to Supabase project admin panel
- Access to Stellar Horizon (testnet or public)
- pnpm and Node.js 22+

## Monitoring

### 1. Check scheduled payment status in Supabase

```bash
# Connect to Supabase
psql postgresql://<user>:<password>@<host>:<port>/<database>

# List all scheduled payments and their status
SELECT
  id,
  user_id,
  recipient,
  amount,
  scheduled_time,
  status,
  created_at,
  error_message
FROM scheduled_payments
ORDER BY scheduled_time DESC
LIMIT 20;

# Find failed payments
SELECT
  id,
  recipient,
  amount,
  status,
  error_message
FROM scheduled_payments
WHERE status = 'failed'
ORDER BY scheduled_time DESC;
```

### 2. Verify transaction on Horizon

Given a transaction hash from the database:

```bash
curl "https://horizon-testnet.stellar.org/transactions/TXHASH"
```

Look for:

- `successful: true` — transaction was submitted and accepted
- `successful: false` — transaction was rejected by the network (see `result_code`)
- Missing — transaction was never submitted or submission timed out

### 3. Check account sequence and balance

```bash
curl "https://horizon-testnet.stellar.org/accounts/GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

Response includes:

- `sequence` — next expected sequence number for this account
- `balances` — array of assets and amounts
- `signers` — authorized signers and their weights

## Troubleshooting

### Symptom: Payment never submitted (status = `pending`, no tx hash)

**Likely causes:**

- Cron job did not run
- Supabase function timed out
- Network issue connecting to Horizon

**Resolution:**

1. Check cron logs in `/api/crons/scheduled-payments`
2. Verify Horizon endpoint is reachable: `curl https://horizon-testnet.stellar.org/health`
3. Manually re-trigger the payment:
   ```bash
   # In the Supabase dashboard, update the payment to 'pending' and retry
   UPDATE scheduled_payments
   SET status = 'pending', error_message = NULL
   WHERE id = 'PAYMENT_ID';
   ```

### Symptom: Insufficient balance (status = `failed`, error includes `op_underfunded`)

**Resolution:**

1. Fund the account via Friendbot:
   ```bash
   curl "https://friendbot.stellar.org?addr=GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
   ```
2. Wait 3–5 seconds for the transaction to finalize
3. Manually retry the payment:
   ```bash
   UPDATE scheduled_payments
   SET status = 'pending', error_message = NULL, retry_count = retry_count + 1
   WHERE id = 'PAYMENT_ID';
   ```

### Symptom: Sequence mismatch (status = `failed`, error includes `tx_bad_seq`)

This occurs if two payments attempt to use the same sequence number simultaneously.

**Resolution:**

1. Check the account's current sequence:
   ```bash
   curl "https://horizon-testnet.stellar.org/accounts/ACCOUNT_ID" | jq '.sequence'
   ```
2. Re-sync the app's in-memory sequence counter:
   ```typescript
   const account = await horizon.loadAccount(accountId);
   // Account.sequence is now up-to-date
   ```
3. Retry the payment with a fresh sequence read:
   ```bash
   UPDATE scheduled_payments
   SET status = 'pending', error_message = NULL, retry_count = retry_count + 1
   WHERE id = 'PAYMENT_ID';
   ```

### Symptom: Transaction rejected (status = `failed`, `result_code` != `tx_success`)

Possible codes and actions:

| Code                | Meaning                       | Action                       |
| ------------------- | ----------------------------- | ---------------------------- |
| `tx_bad_auth`       | Signer weight insufficient    | Verify wallet signer config  |
| `tx_bad_nonce`      | Sequence out of order         | Reload account sequence      |
| `tx_size_too_big`   | Too many operations in one tx | Split into multiple txs      |
| `op_no_destination` | Invalid recipient address     | Verify recipient in database |
| `op_underfunded`    | Insufficient balance          | Fund account                 |

See [Stellar Errors](https://developers.stellar.org/docs/learn/encyclopedia/transactions/transaction-errors) for a complete list.

## Recovery Procedures

### Batch retry failed payments

```bash
# Retry all failed payments created in the last 24 hours
UPDATE scheduled_payments
SET status = 'pending', error_message = NULL, retry_count = retry_count + 1
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '1 day'
  AND retry_count < 3
RETURNING id, recipient, amount;
```

### Manual transaction submission

If a payment is ready to submit but the cron job is stuck:

```typescript
import { submitScheduledPayment } from "@/lib/schedule-service";

// Load payment from database
const payment = await supabase
	.from("scheduled_payments")
	.select("*")
	.eq("id", "PAYMENT_ID")
	.single();

// Attempt submission
try {
	const tx = await submitScheduledPayment(payment);
	console.log("Submitted:", tx.hash);
} catch (error) {
	console.error("Submission failed:", error);
}
```

### Clear stuck payments

If a payment is permanently failed and no retry is desired:

```bash
UPDATE scheduled_payments
SET status = 'canceled', error_message = 'Manually canceled'
WHERE id = 'PAYMENT_ID';
```

## Monitoring Alerts

### Suggested alerts (integrate with your observability stack)

1. **Payment failure rate > 5%** — Trigger investigation
2. **Sequence mismatch in last 1 hour** — Check account state
3. **Cron job timeout** — Check infrastructure or Horizon connectivity
4. **Failed payment accumulation > 10** — Escalate to ops

## Testing recovery locally

```bash
# Simulate a failed payment
pnpm test -- --grep "schedule.*fail"

# Verify retry logic
pnpm test -- --grep "schedule.*retry"

# Integration test against testnet
pnpm test:stellar
```

## Escalation

- **Database issues:** Check Supabase status at supabase.com/status
- **Stellar network issues:** Check at stellar.org or Horizon status
- **Application bug:** File an issue with steps to reproduce and testnet tx hashes
