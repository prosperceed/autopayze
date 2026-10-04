import { createClient } from '@supabase/supabase-js';

/**
 * Returns a Supabase client authenticated as the service role, bypassing all
 * Row-Level Security (RLS) policies. Only ever call this from secure server
 * contexts (API route handlers, server actions, cron workers). Never expose
 * the resulting client or its responses to the browser.
 *
 * Throws a descriptive error if either required environment variable is absent,
 * so misconfiguration fails loudly at call time rather than producing silent
 * null-pointer failures downstream.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      'createAdminClient: NEXT_PUBLIC_SUPABASE_URL is not set. ' +
        'Add it to your .env.local (or Vercel environment variables).'
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      'createAdminClient: SUPABASE_SERVICE_ROLE_KEY is not set. ' +
        'This server-only key is required to bypass RLS. ' +
        'Add it to your .env.local (or Vercel environment variables) and ' +
        'ensure it is never prefixed with NEXT_PUBLIC_.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
