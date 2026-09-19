-- ==============================================================================
-- Autopayze: Complete Database Schema
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ==============================================================================

-- 1. App Roles & Profiles
do $$ begin
  create type public.app_role as enum ('user', 'admin');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

do $$ begin
  create policy "Users can read their own profile"
    on public.profiles for select
    using (auth.uid() = id);
exception
  when duplicate_object then null;
end $$;

-- Profile creation trigger on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Wallets
create table if not exists public.wallets (
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

do $$ begin
  create policy "Users can read own wallet"
    on public.wallets for select
    using (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can upsert own wallet"
    on public.wallets for insert
    with check (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can update own wallet"
    on public.wallets for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;

-- 3. Agent Prompt History
create table if not exists public.agent_prompt_history (
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

create index if not exists agent_prompt_history_user_created_idx
  on public.agent_prompt_history (user_id, created_at desc);

alter table public.agent_prompt_history enable row level security;

do $$ begin
  create policy "Users can read own prompt history"
    on public.agent_prompt_history for select
    using (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can insert own prompt history"
    on public.agent_prompt_history for insert
    with check (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;

-- 4. Agent Transactions
create table if not exists public.agent_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  wallet_address text not null,
  wallet_network text not null,
  action_type text not null check (action_type in ('payment', 'schedule_payment', 'airdrop')),
  prompt_text text not null,
  summary text not null,
  intent_payload jsonb not null default '{}'::jsonb,
  status text not null check (status in ('accepted', 'review_required', 'rejected', 'executed', 'failed')),
  amount text,
  recipient text,
  asset text,
  memo text,
  tx_hash text,
  created_at timestamptz not null default now()
);

create index if not exists agent_transactions_user_created_idx
  on public.agent_transactions (user_id, created_at desc);

alter table public.agent_transactions enable row level security;

do $$ begin
  create policy "Users can read own transaction history"
    on public.agent_transactions for select
    using (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can insert own transaction history"
    on public.agent_transactions for insert
    with check (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can update own transaction history"
    on public.agent_transactions for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;

