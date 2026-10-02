-- Scheduled Payments
-- Stores recurring/future payment rules created via agent schedule_payment intents.
-- The execution engine reads rows where next_run_at <= now() and status = 'active'.

create table if not exists public.scheduled_payments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  wallet_address  text not null,
  wallet_network  text not null default 'stellar-testnet',
  recipient       text not null,
  amount          text not null,
  asset           text not null default 'XLM',
  memo            text,
  frequency       text not null check (frequency in ('once', 'daily', 'weekly', 'monthly')),
  next_run_at     timestamptz not null,
  end_at          timestamptz,
  occurrences     integer,
  runs_completed  integer not null default 0,
  status          text not null default 'active' check (status in ('active', 'paused', 'completed', 'failed')),
  last_tx_hash    text,
  last_run_at     timestamptz,
  last_error      text,
  prompt_text     text,
  created_at      timestamptz not null default now()
);

create index if not exists scheduled_payments_due_idx
  on public.scheduled_payments (next_run_at, status);

create index if not exists scheduled_payments_user_idx
  on public.scheduled_payments (user_id, created_at desc);

alter table public.scheduled_payments enable row level security;

do $$ begin
  create policy "Users can read own schedules"
    on public.scheduled_payments for select
    using (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can insert own schedules"
    on public.scheduled_payments for insert
    with check (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can update own schedules"
    on public.scheduled_payments for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Service role can manage all schedules"
    on public.scheduled_payments for all
    using (true);
exception
  when duplicate_object then null;
end $$;
