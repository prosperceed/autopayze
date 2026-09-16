import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "user" | "admin";

export type AuthedUser = {
  id: string;
  email: string | null;
  role: AppRole;
};

/**
 * Single source of truth for "who is signed in, and what is their
 * role". Every page/route that needs auth should call requireUser()
 * or requireAdmin() rather than re-implementing this check — that's
 * what keeps the logic from drifting across admin pages.
 *
 * Role comes from the `profiles` table (see README: "Provisioning
 * the admin role"), not from client-supplied data, so it can't be
 * spoofed from the browser.
 */
async function getAuthedUser(): Promise<AuthedUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? null,
    role: (profile?.role as AppRole) ?? "user",
  };
}

/** Call from any Server Component / Server Action that requires a signed-in user. */
export async function requireUser(): Promise<AuthedUser> {
  const user = await getAuthedUser();
  if (!user) redirect("/login");
  return user;
}

/** Call from any Server Component / Server Action under /admin. */
export async function requireAdmin(): Promise<AuthedUser> {
  const user = await getAuthedUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/unauthorized");
  return user;
}

/** Non-throwing variant for places that want to branch on auth state (e.g. marketing header). */
export async function getOptionalUser(): Promise<AuthedUser | null> {
  return getAuthedUser();
}
