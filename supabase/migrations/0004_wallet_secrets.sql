-- wallet_secrets
-- Stores encrypted signing keys for wallets that opt in to autonomous scheduled execution.
-- Only the service role can read this table. The schedule runner uses it to sign transactions.
-- Users can store/overwrite their own secret but cannot read it back via the API.

create table if not exists public.wallet_secrets (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  wallet_address text not null,
  -- Secret key stored as-is for testnet demo wallets.
  -- For production, encrypt at application layer before inserting.
  encrypted_secret text not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, wallet_address)
);

create index if not exists wallet_secrets_address_idx
  on public.wallet_secrets (wallet_address);

alter table public.wallet_secrets enable row level security;

-- Users can insert/update their own secret (write-only from user side)
do $$ begin
  create policy "Users can upsert own wallet secret"
    on public.wallet_secrets for insert
    with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can update own wallet secret"
    on public.wallet_secrets for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

-- Users deliberately CANNOT select their own secrets via the anon/user role.
-- Only the service role (used by the schedule runner) can read secrets.
