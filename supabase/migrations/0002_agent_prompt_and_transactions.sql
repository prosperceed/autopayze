create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  address text not null,
  network text not null,
  wallet_type text not null default 'Freighter',
  is_active boolean not null default true,
  connected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.wallets enable row level security;

create policy "Users can read own wallet"
  on public.wallets for select
  using (auth.uid() = user_id);

create policy "Users can upsert own wallet"
  on public.wallets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own wallet"
  on public.wallets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.agent_prompt_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  wallet_address text not null,
  wallet_network text not null,
  prompt_text text not null,
  response_summary text not null,
  action_type text not null check (action_type in ('payment', 'schedule_payment', 'airdrop')),
  intent_payload jsonb not null default '{}'::jsonb,
  status text not null check (status in ('accepted', 'review_required', 'rejected')),
  created_at timestamptz not null default now()
);

create index agent_prompt_history_user_created_idx
  on public.agent_prompt_history (user_id, created_at desc);

create table public.agent_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  wallet_address text not null,
  wallet_network text not null,
  action_type text not null check (action_type in ('payment', 'schedule_payment', 'airdrop')),
  prompt_text text not null,
  summary text not null,
  intent_payload jsonb not null default '{}'::jsonb,
  status text not null check (status in ('accepted', 'review_required', 'rejected')),
  amount text,
  recipient text,
  asset text,
  memo text,
  created_at timestamptz not null default now()
);

create index agent_transactions_user_created_idx
  on public.agent_transactions (user_id, created_at desc);

alter table public.agent_prompt_history enable row level security;
alter table public.agent_transactions enable row level security;

create policy "Users can read own prompt history"
  on public.agent_prompt_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own prompt history"
  on public.agent_prompt_history for insert
  with check (auth.uid() = user_id);

create policy "Users can read own transaction history"
  on public.agent_transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own transaction history"
  on public.agent_transactions for insert
  with check (auth.uid() = user_id);
