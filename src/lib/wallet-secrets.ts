"use server";

/**
 * wallet-secrets.ts
 *
 * Stores and retrieves Stellar signing keys for the autonomous schedule runner.
 *
 * Encryption contract
 * -------------------
 * Secrets are encrypted at rest using AES-256-GCM before being written to
 * `wallet_secrets.encrypted_secret`. The key is derived from the env var
 * WALLET_ENCRYPTION_KEY (exactly 64 hex characters = 32 bytes).
 *
 * Stored format:  "<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 *
 * The cron runner calls decryptSecret() to recover the raw 'S...' key before
 * calling Keypair.fromSecret().
 *
 * If WALLET_ENCRYPTION_KEY is absent the helpers throw at call time — this
 * is an intentional hard failure so misconfiguration is immediately visible
 * in logs rather than silently storing plaintext secrets.
 *
 * Security notes
 * --------------
 * - A fresh random 12-byte IV is generated per encrypt call (never reused).
 * - The GCM auth tag (16 bytes) is stored alongside the ciphertext so
 *   tampering is detected on decrypt.
 * - RLS on wallet_secrets prevents the user role from reading rows back;
 *   only the service-role cron runner can SELECT.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// Encryption helpers
// ---------------------------------------------------------------------------

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;   // 96-bit IV — recommended for GCM
const TAG_BYTES = 16;  // GCM auth tag length

/**
 * Returns the 32-byte encryption key from WALLET_ENCRYPTION_KEY.
 * Throws with a clear message if the variable is absent or malformed.
 */
function getEncryptionKey(): Buffer {
  const raw = process.env.WALLET_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "wallet-secrets: WALLET_ENCRYPTION_KEY is not set. " +
        "Generate a 32-byte key with: openssl rand -hex 32",
    );
  }
  if (!/^[0-9a-fA-F]{64}$/.test(raw)) {
    throw new Error(
      "wallet-secrets: WALLET_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). " +
        "Re-generate with: openssl rand -hex 32",
    );
  }
  return Buffer.from(raw, "hex");
}

/**
 * Encrypts a raw Stellar secret key ('S...') into the stored format:
 *   "<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 */
export function encryptSecret(rawSecret: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_BYTES);

  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_BYTES,
  });

  const encrypted = Buffer.concat([
    cipher.update(rawSecret, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    tag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

/**
 * Decrypts a stored secret back to the raw 'S...' Stellar secret key.
 *
 * Throws if:
 * - The stored value does not match the expected format (not yet encrypted,
 *   or corrupted).
 * - GCM authentication fails (ciphertext was tampered with).
 * - WALLET_ENCRYPTION_KEY is wrong.
 */
export function decryptSecret(stored: string): string {
  const parts = stored.split(":");
  if (parts.length !== 3) {
    // Stored value is not in our ciphertext format.
    // This happens when a plaintext secret ('S...') exists from before
    // encryption was introduced. Reject it so callers know to re-store.
    throw new Error(
      "wallet-secrets: stored value is not in encrypted format " +
        "(expected iv:tag:ciphertext). " +
        "The wallet secret must be re-submitted via /api/wallet/secret.",
    );
  }

  const [ivHex, tagHex, ciphertextHex] = parts;

  let iv: Buffer, tag: Buffer, ciphertext: Buffer;
  try {
    iv = Buffer.from(ivHex, "hex");
    tag = Buffer.from(tagHex, "hex");
    ciphertext = Buffer.from(ciphertextHex, "hex");
  } catch {
    throw new Error("wallet-secrets: stored secret contains invalid hex data.");
  }

  const key = getEncryptionKey();

  try {
    const decipher = createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: TAG_BYTES,
    });
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch {
    throw new Error(
      "wallet-secrets: decryption failed. The ciphertext may be corrupted, " +
        "or WALLET_ENCRYPTION_KEY does not match the key used to encrypt.",
    );
  }
}

// ---------------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------------

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
