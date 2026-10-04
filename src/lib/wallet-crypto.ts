/**
 * wallet-crypto.ts
 *
 * Pure AES-256-GCM encrypt/decrypt helpers for Stellar signing keys.
 * No "use server" — these are synchronous utility functions safe to import
 * from any server-side module (API routes, Server Actions, cron workers).
 * Never import this file into client-side code.
 *
 * Stored format:  "<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 *
 * Environment variable required (server-only):
 *   WALLET_ENCRYPTION_KEY — exactly 64 hex characters (32 bytes)
 *   Generate with: openssl rand -hex 32
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;  // 96-bit IV — recommended for GCM
const TAG_BYTES = 16; // GCM auth tag length

/**
 * Returns the 32-byte encryption key from WALLET_ENCRYPTION_KEY.
 * Throws with a clear message if the variable is absent or malformed.
 */
function getEncryptionKey(): Buffer {
  const raw = process.env.WALLET_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "wallet-crypto: WALLET_ENCRYPTION_KEY is not set. " +
        "Generate a 32-byte key with: openssl rand -hex 32",
    );
  }
  if (!/^[0-9a-fA-F]{64}$/.test(raw)) {
    throw new Error(
      "wallet-crypto: WALLET_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). " +
        "Re-generate with: openssl rand -hex 32",
    );
  }
  return Buffer.from(raw, "hex");
}

/**
 * Encrypts a raw Stellar secret key ('S...') into the stored format:
 *   "<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 *
 * A fresh random 12-byte IV is generated on every call — never reused.
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

  return [iv.toString("hex"), tag.toString("hex"), encrypted.toString("hex")].join(":");
}

/**
 * Decrypts a stored ciphertext back to the raw 'S...' Stellar secret key.
 *
 * Throws if:
 * - The stored value is not in iv:tag:ciphertext format (e.g. a legacy plaintext secret).
 * - GCM authentication fails (ciphertext was tampered with).
 * - WALLET_ENCRYPTION_KEY does not match the key used to encrypt.
 */
export function decryptSecret(stored: string): string {
  const parts = stored.split(":");
  if (parts.length !== 3) {
    throw new Error(
      "wallet-crypto: stored value is not in encrypted format " +
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
    throw new Error("wallet-crypto: stored secret contains invalid hex data.");
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
      "wallet-crypto: decryption failed. The ciphertext may be corrupted, " +
        "or WALLET_ENCRYPTION_KEY does not match the key used to encrypt.",
    );
  }
}
