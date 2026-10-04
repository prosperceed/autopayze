-- Migration: patch agent_transactions to match 0000_combined_schema.sql
--
-- Migration 0002 created agent_transactions without:
--   1. The `tx_hash` column (needed by AgentTransactionInsert.tx_hash and
--      the /execute route that records on-chain hashes after execution).
--   2. 'executed' and 'failed' values in the status CHECK constraint
--      (AgentTransactionInsert.status includes these; inserts would be
--      rejected at the DB level without this patch).
--
-- Additionally adds the update RLS policy that 0002 omitted but
-- 0000_combined_schema.sql includes, so users can update their own records
-- (e.g. status transitions from 'accepted' → 'executed' via /execute).

-- 1. Add tx_hash column if it does not already exist.
alter table public.agent_transactions
  add column if not exists tx_hash text;

-- 2. Widen the status constraint to include 'executed' and 'failed'.
--    Drop the old constraint first (named by Postgres convention), then re-add.
alter table public.agent_transactions
  drop constraint if exists agent_transactions_status_check;

alter table public.agent_transactions
  add constraint agent_transactions_status_check
    check (status in ('accepted', 'review_required', 'rejected', 'executed', 'failed'));

-- 3. Add the update RLS policy that was missing from 0002.
do $$ begin
  create policy "Users can update own transaction history"
    on public.agent_transactions for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;
