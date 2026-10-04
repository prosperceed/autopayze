-- Add 'processing' to the scheduled_payments status constraint.
-- Required so the cron runner can atomically lock rows before submitting
-- to Stellar, preventing duplicate sends on concurrent invocations.

alter table public.scheduled_payments
  drop constraint if exists scheduled_payments_status_check;

alter table public.scheduled_payments
  add constraint scheduled_payments_status_check
    check (status in ('active', 'processing', 'paused', 'completed', 'failed'));
