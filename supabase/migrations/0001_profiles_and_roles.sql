-- Autopayze: user/admin role model
-- Run against your Supabase project (SQL editor or `supabase db push`).

create type public.app_role as enum ('user', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A user can read their own profile (this is what requireUser/requireAdmin
-- rely on to resolve `role` — see src/lib/auth.ts).
create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- No insert/update/delete policies are defined for regular users on
-- purpose: role changes should only happen via the Supabase dashboard,
-- a service-role script, or admin tooling built in a later phase — never
-- from a client request.

-- Auto-create a `user`-role profile row whenever someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
