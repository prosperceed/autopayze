# Autopayze — frontend foundation

Next.js 16 (App Router) frontend for Autopayze: wallet, payments, schedules,
airdrops, an AI agent interface, and an admin dashboard, all themed for
light and dark mode from a shared token system.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

Then run the SQL migration in `supabase/migrations/0001_profiles_and_roles.sql`
against your Supabase project before testing auth (SQL editor, or
`supabase db push` if you use the CLI).

## What's implemented in this phase

- Full route shell: marketing page, auth (`/login`, `/signup`), the
  authenticated app (`/dashboard`, `/wallet`, `/payments`, `/schedules`,
  `/airdrops`, `/agent`, `/activity`, `/settings`), and `/admin` with its
  nested routes.
- Light/dark theming via semantic Tailwind tokens (see "Theming" below).
- Supabase auth (email/password) wired to real sign-in/sign-up/sign-out.
- Server-side admin authorization (see "Admin access" below).
- Reusable `DataTable`, `Card`, `Button`, `Badge`, `EmptyState` primitives.

**Not implemented yet** (intentionally — this phase is the frontend
foundation, not execution logic): actual payment/schedule/airdrop
execution, the AI agent's backend, and real data behind the admin
tables. Every page that would show that data currently shows an honest
empty state instead of fabricated numbers — wire up a Supabase query (or
API route) where you see `rows={[]}` / `status="empty"` in the admin
pages, and in the dashboard's summary cards.

## Theming

All colors are semantic tokens (`background`, `foreground`, `muted`,
`border`, `card`, `input`, `primary`, `destructive`, `success`, `warning`,
`info`) defined as CSS variables in `src/app/globals.css`, once for
`:root` (light) and once for `.dark`. Tailwind's `darkMode: "class"` picks
up the `.dark` class on `<html>`.

- **No flash of wrong theme**: an inline script in `src/app/layout.tsx`
  (`themeInitScript`, from `theme-provider.tsx`) runs before paint and
  applies `.dark` to `<html>` synchronously, reading the same
  `localStorage` key the React `ThemeProvider` uses afterward.
- **Persistence + system preference**: `ThemeProvider` supports
  `light` / `dark` / `system`, persists the choice to `localStorage`, and
  listens for OS-level theme changes when set to `system`.
- **Switching themes**: the `<ThemeSwitcher />` component (used in the
  marketing header, app header, and both settings pages).

When building new UI, reach for the Tailwind classes that resolve to
these tokens (`bg-card`, `text-muted-foreground`, `border-border`, etc.)
rather than a hard-coded color, so it's correct in both themes for free.

## Admin access

`/admin` is protected in two layers:

1. **`src/proxy.ts`** (Next.js 16's replacement for `middleware.ts`) — runs on every request to `/admin/*`. Redirects
   unauthenticated visitors to `/login?next=/admin`, and authenticated
   non-admins to `/unauthorized`, before any admin page renders.
2. **`src/app/admin/layout.tsx`** — calls `requireAdmin()` again at render
   time, so no nested admin page can accidentally skip the check.

Both read the caller's role from the `profiles` table (see the migration),
never from anything the client sends — so it can't be spoofed by editing
a cookie or request body.

### Provisioning the admin role

There's no admin-management UI in this phase (see `/admin/settings`).
To make a user an admin right now:

```sql
update public.profiles set role = 'admin' where email = 'someone@example.com';
```

Run that in the Supabase SQL editor. A future phase can add a proper
"manage admins" screen on top of the same `profiles.role` column.

### Service-role key

`SUPABASE_SERVICE_ROLE_KEY` in `.env.example` is there for when a future
phase needs privileged writes that bypass RLS (e.g. an admin bulk action).
It's deliberately unused right now. If you do add it: only reference it
inside a route handler or server action, never a Client Component, and
never give it a `NEXT_PUBLIC_` prefix.

## Project structure

```
src/
  app/
    page.tsx                 marketing landing page
    login/, signup/, auth/callback/
    (app)/                   route group — all wrapped by requireUser()
      dashboard/ wallet/ payments/ schedules/ airdrops/ agent/ activity/ settings/
    admin/                   wrapped by requireAdmin()
      users/ payments/ schedules/ airdrops/ wallets/ agent/ activity/ settings/
    unauthorized/
  components/
    theme/                   ThemeProvider, ThemeSwitcher
    ui/                      Button, Card, Badge, DataTable, EmptyState
    layout/                  headers, sidebars, nav, auth shell
    marketing/, auth/
  lib/
    supabase/                browser client, server client, middleware helper
    auth.ts                  requireUser(), requireAdmin(), getOptionalUser()
```
