"use server";

/**
 * wallet-secrets.ts
 *
 * Server Actions for storing Stellar signing keys in Supabase.
 * All exports must be async — this file carries the "use server" directive.
 *
 * Crypto helpers (encryptSecret / decryptSecret) live in wallet-crypto.ts
 * which has no "use server" directive and can be imported by the cron runner
 * and any other server-side module without triggering the async requirement.
 */

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptSecret } from "@/lib/wallet-crypto";

/**
 * Encrypts the raw Stellar secret key and upserts it into wallet_secrets.
 * Called from the wallet-connection flow when the user opts into autonomous
 * schedule execution.
 */
export async function upsertWalletSecret(
  walletAddress: string,
  secretKey: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    // Validate format before storing — catches accidental public-key submissions.
    if (!secretKey.startsWith("S") || secretKey.length !== 56) {
      return {
        ok: false,
        error:
          "Invalid signing key format. Expected a 56-character Stellar secret key starting with 'S'.",
      };
    }

    // Encrypt before writing to the database.
    let encryptedValue: string;
    try {
      encryptedValue = encryptSecret(secretKey);
    } catch (encErr) {
      const msg = encErr instanceof Error ? encErr.message : String(encErr);
      console.error("upsertWalletSecret: encryption failed:", msg);
      return { ok: false, error: msg };
    }

    // Resolve the authenticated user via the SSR session cookie.
    const serverClient = await createServerClient();
    const {
      data: { user },
    } = await serverClient.auth.getUser();

    if (!user) {
      return { ok: false, error: "Not authenticated" };
    }

    // Always use the admin client for the write to bypass RLS.
    const admin = createAdminClient();

    const { error } = await admin.from("wallet_secrets").upsert(
      {
        user_id: user.id,
        wallet_address: walletAddress,
        encrypted_secret: encryptedValue,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,wallet_address" },
    );

    if (error) {
      console.warn("upsertWalletSecret DB error:", error.message);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("upsertWalletSecret exception:", msg);
    return { ok: false, error: msg };
  }
}
