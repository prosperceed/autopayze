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
    // Use the admin client so we bypass RLS on the insert/upsert.
    // The admin client is only available server-side.
    const admin = createAdminClient();

    // Fall back to the authed server client — this works because the user role
    // has INSERT/UPDATE permission on their own rows.
    const supabase = admin ?? (await createServerClient());

    const {
      data: { user },
    } = await (await createServerClient()).auth.getUser();

    if (!user) {
      return { ok: false, error: "Not authenticated" };
    }

    const { error } = await supabase.from("wallet_secrets").upsert(
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
