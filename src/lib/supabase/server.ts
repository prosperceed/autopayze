import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Server-side Supabase client, scoped to the incoming request's
 * cookies. This is what server components, server actions and route
 * handlers use to read the current session. It still only carries
 * the anon key — RLS policies (not this client) are what constrain
 * what a signed-in user can read/write. The service-role key, if
 * ever needed for privileged admin writes, must only be used inside
 * a route handler / server action, and must be read from an
 * un-prefixed env var (no NEXT_PUBLIC_) so it can never reach the
 * browser bundle.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component during render — the
            // middleware below is what actually refreshes the
            // session cookie in that case, so this can be ignored.
          }
        },
      },
    },
  );
}
