"use server";

/**
 * Stores a wallet signing key server-side so the autonomous schedule runner
 * can sign transactions without the user being present.
 *
 * This is intentionally write-only from the user's perspective — RLS prevents
 * the user from reading the secret back. Only the service-role schedule runner
 * can select from wallet_secrets.
 *
 * Security note: secrets are stored as-is here. For a production deployment
 * add AES-256-GCM encryption at rest using a server-side KMS key before inserting.
 */

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function upsertWalletSecret(
  walletAddress: string,
  secretKey: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    // Resolve the authenticated user via the SSR session cookie.
    // This is called from an API route handler where the request cookies are
    // available in the Next.js context, so getUser() will succeed as long as
    // the user has an active session.
    const serverClient = await createServerClient();
    const {
      data: { user },
    } = await serverClient.auth.getUser();

    if (!user) {
      return { ok: false, error: "Not authenticated" };
    }

    // Always use the admin client for the write so we bypass RLS entirely.
    // The admin client is the only way to guarantee the upsert succeeds
    // regardless of the RLS policy state on wallet_secrets.
    const admin = createAdminClient();
    if (!admin) {
      return { ok: false, error: "Admin client unavailable — check SUPABASE_SERVICE_ROLE_KEY" };
    }

    const { error } = await admin.from("wallet_secrets").upsert(
      {
        user_id: user.id,
        wallet_address: walletAddress,
        encrypted_secret: secretKey,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,wallet_address" },
    );

    if (error) {
      console.warn("upsertWalletSecret error:", error.message);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("upsertWalletSecret exception:", msg);
    return { ok: false, error: msg };
  }
}
