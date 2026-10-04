"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  startTransition,
  type ReactNode,
} from "react";
import {
  getNetwork as getFreighterNetwork,
  requestAccess,
  signTransaction as signFreighterTransaction,
} from "@stellar/freighter-api";
import { Keypair, TransactionBuilder } from "@stellar/stellar-sdk";
import { createClient } from "@/lib/supabase/client";
import { getNetworkConfig } from "@/lib/stellar/client";
import { getConfiguredNetwork } from "@/lib/stellar/network";
import { fundTestnetAccount } from "@/lib/stellar/transaction";
import {
  detectWalletNetwork,
  getWalletWarning,
  isWalletAddressValid,
} from "@/lib/stellar/wallet";

export type WalletConnection = {
  address: string;
  network: string;
  walletType: "Freighter" | "Manual" | "TestnetDemo";
  connectedAt: string;
};

export type WalletContextValue = {
  connection: WalletConnection | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  connectManual: (address: string, secretKey?: string) => Promise<void>;
  connectTestnetDemo: () => Promise<void>;
  connectMobileFreighter: () => Promise<void>;
  disconnect: () => void;
  getAddress: () => string | null;
  getNetwork: () => string | null;
  signTransaction: (transactionXdr: string) => Promise<string | null>;
  warning: string | null;
  error: string | null;
  isFreighterAvailable: boolean;
  isMobile: boolean;
  isConnecting: boolean;
  balanceVersion: number;
  refreshBalance: () => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);
const WALLET_STORAGE_KEY = "autopayze-wallet-state";
const DEMO_SECRET_STORAGE_KEY = "autopayze-demo-secret";

function readStoredWallet(): WalletConnection | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(WALLET_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WalletConnection>;
    if (!parsed.address || !parsed.network || !parsed.connectedAt) return null;
    return {
      address: parsed.address,
      network: parsed.network,
      walletType: (parsed.walletType as WalletConnection["walletType"]) ?? "Freighter",
      connectedAt: parsed.connectedAt,
    };
  } catch {
    return null;
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const expectedNetwork = getConfiguredNetwork();
  const [connection, setConnection] = useState<WalletConnection | null>(readStoredWallet);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFreighterAvailable, setIsFreighterAvailable] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [balanceVersion, setBalanceVersion] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    startTransition(() => {
      setIsMobile(/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent));
    });

    // Freighter injects window.freighter asynchronously after the extension
    // initialises. Check immediately, then retry a few times with short delays
    // to catch the common case where the extension loads after React hydration.
    let attempts = 0;
    const MAX_ATTEMPTS = 8;
    const RETRY_DELAY_MS = 250;

    function checkFreighter() {
      const hasFreighter = Boolean(
        (window as unknown as { freighter?: unknown }).freighter,
      );
      if (hasFreighter) {
        startTransition(() => setIsFreighterAvailable(true));
        return;
      }
      if (attempts < MAX_ATTEMPTS) {
        attempts++;
        setTimeout(checkFreighter, RETRY_DELAY_MS);
      }
      // After MAX_ATTEMPTS (~2 s) with no extension found, leave as false.
    }

    checkFreighter();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (connection) {
      window.localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(connection));
      return;
    }
    window.localStorage.removeItem(WALLET_STORAGE_KEY);
  }, [connection]);

  const syncWalletToSupabase = useCallback(
    async (
      walletAddress: string,
      walletNetwork: string,
      active: boolean,
      walletType: string = "Freighter",
    ) => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { error: upsertError } = await supabase.from("wallets").upsert(
          {
            user_id: user.id,
            address: walletAddress,
            network: walletNetwork,
            wallet_type: walletType,
            is_active: active,
            connected_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );

        if (upsertError) {
          console.warn("Wallet sync failed:", upsertError.message);
        }
      } catch (err) {
        console.warn("Exception during wallet sync:", err);
      }
    },
    [],
  );

  // 1. Connect with Freighter extension (desktop)
  const connect = useCallback(async () => {
    setError(null);
    setIsConnecting(true);

    try {
      const addressResult = await requestAccess();
      if (addressResult.error || !isWalletAddressValid(addressResult.address)) {
        throw new Error(
          addressResult.error
            ? "Freighter extension was not detected or access was denied. On mobile, use 'Enter Address' or 'Testnet Demo Wallet'."
            : "invalidAddress",
        );
      }

      const networkResult = await getFreighterNetwork();
      const resolvedNetwork = detectWalletNetwork(networkResult.network);
      if (networkResult.error || !resolvedNetwork || resolvedNetwork !== expectedNetwork) {
        throw new Error("wrongNetwork");
      }

      const nextConnection: WalletConnection = {
        address: addressResult.address.trim(),
        network: resolvedNetwork,
        walletType: "Freighter",
        connectedAt: new Date().toISOString(),
      };

      setConnection(nextConnection);
      await syncWalletToSupabase(nextConnection.address, nextConnection.network, true, "Freighter");
      window.localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(nextConnection));
    } catch (connectionError) {
      setError(
        connectionError instanceof Error
          ? connectionError.message
          : "Freighter is unavailable. Please choose another connection method.",
      );
    } finally {
      setIsConnecting(false);
    }
  }, [expectedNetwork, syncWalletToSupabase]);

  // 2. Connect with manual Stellar address (ideal for mobile or external wallets)
  const connectManual = useCallback(
    async (rawAddress: string, secretKey?: string) => {
      setError(null);
      setIsConnecting(true);

      try {
        const address = rawAddress.trim();
        if (!isWalletAddressValid(address)) {
          throw new Error("Invalid Stellar public address (must start with G and be 56 characters).");
        }

        if (secretKey && secretKey.trim()) {
          try {
            const kp = Keypair.fromSecret(secretKey.trim());
            if (kp.publicKey() !== address) {
              throw new Error("The secret key does not match the provided public address.");
            }
            if (typeof window !== "undefined") {
              window.sessionStorage.setItem(DEMO_SECRET_STORAGE_KEY, secretKey.trim());
            }
          } catch (secError) {
            throw new Error(secError instanceof Error ? secError.message : "Invalid secret key format.");
          }
        }

        const nextConnection: WalletConnection = {
          address,
          network: expectedNetwork,
          walletType: "Manual",
          connectedAt: new Date().toISOString(),
        };

        setConnection(nextConnection);
        await syncWalletToSupabase(nextConnection.address, nextConnection.network, true, "Manual");
        window.localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(nextConnection));

        // If a secret key was provided, persist it server-side for the schedule runner.
        if (secretKey && secretKey.trim()) {
          fetch("/api/wallet/secret", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ walletAddress: address, secretKey: secretKey.trim() }),
          }).catch((e) => console.warn("Could not persist wallet secret for schedule runner:", e));
        }
      } catch (manualError) {
        setError(manualError instanceof Error ? manualError.message : "Failed to connect address.");
        throw manualError;
      } finally {
        setIsConnecting(false);
      }
    },
    [expectedNetwork, syncWalletToSupabase],
  );

  // 3. One-click create & fund Testnet Demo Wallet (perfect for mobile device testing)
  const connectTestnetDemo = useCallback(async () => {
    setError(null);
    setIsConnecting(true);

    try {
      const keypair = Keypair.random();
      const address = keypair.publicKey();
      const secret = keypair.secret();

      // Auto-fund via Friendbot
      await fundTestnetAccount(address);

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(DEMO_SECRET_STORAGE_KEY, secret);
      }

      const nextConnection: WalletConnection = {
        address,
        network: "stellar-testnet",
        walletType: "TestnetDemo",
        connectedAt: new Date().toISOString(),
      };

      setConnection(nextConnection);
      await syncWalletToSupabase(nextConnection.address, nextConnection.network, true, "TestnetDemo");
      window.localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(nextConnection));

      // Store the secret server-side so the schedule runner can sign autonomously.
      // Fire-and-forget: a failure here is non-fatal — scheduled execution will
      // fall back to "skipped" rather than crashing the connect flow.
      fetch("/api/wallet/secret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address, secretKey: secret }),
      }).catch((e) => console.warn("Could not persist wallet secret for schedule runner:", e));
    } catch (demoError) {
      setError(demoError instanceof Error ? demoError.message : "Failed to initialize testnet demo wallet.");
      throw demoError;
    } finally {
      setIsConnecting(false);
    }
  }, [syncWalletToSupabase]);

  // 4. Mobile Freighter — SEP-0007 deep link flow
  // Opens the Freighter mobile app which redirects back to /auth/wallet-callback
  // with the user's public key.  We poll the session API until the key arrives,
  // then complete the connection client-side.
  const connectMobileFreighter = useCallback(async () => {
    setError(null);
    setIsConnecting(true);

    try {
      // Generate a one-time token for this session
      const token = Array.from(crypto.getRandomValues(new Uint8Array(24)))
        .map((b) => b.toString(36).padStart(2, "0"))
        .join("")
        .slice(0, 32);

      // Register the pending session server-side
      await fetch("/api/wallet/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      // Build the callback URL Freighter will return to
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const callbackUrl = encodeURIComponent(
        `${origin}/auth/wallet-callback?token=${token}&pubkey={PUBLIC_KEY}`,
      );

      // SEP-0007 URI — `web+stellar:` deep link opens Freighter mobile
      // The `?callback=` param tells Freighter where to redirect after approval
      const sep7Uri = `web+stellar:pay?callback=${callbackUrl}`;

      // Open deep link — on mobile this hands off to the Freighter app
      window.location.href = sep7Uri;

      // Poll for the callback to complete (Freighter returns to /auth/wallet-callback
      // which writes the address into the session, then we pick it up here)
      const address = await new Promise<string>((resolve, reject) => {
        const started = Date.now();
        const TIMEOUT = 5 * 60 * 1000; // 5 min

        const interval = setInterval(async () => {
          if (Date.now() - started > TIMEOUT) {
            clearInterval(interval);
            await fetch(`/api/wallet/session?token=${token}`, { method: "DELETE" });
            reject(new Error("Connection timed out. Please try again."));
            return;
          }

          try {
            const res = await fetch(`/api/wallet/session?token=${token}`);
            const json = await res.json() as { status: string; address?: string };

            if (json.status === "resolved" && json.address) {
              clearInterval(interval);
              resolve(json.address);
            } else if (json.status === "expired") {
              clearInterval(interval);
              reject(new Error("Session expired. Please try again."));
            }
            // "pending" → keep polling
          } catch {
            // network hiccup — keep polling
          }
        }, 2000);
      });

      const nextConnection: WalletConnection = {
        address,
        network: expectedNetwork,
        walletType: "Freighter",
        connectedAt: new Date().toISOString(),
      };

      setConnection(nextConnection);
      await syncWalletToSupabase(nextConnection.address, nextConnection.network, true, "Freighter");
      window.localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(nextConnection));
    } catch (mobileError) {
      setError(
        mobileError instanceof Error
          ? mobileError.message
          : "Mobile Freighter connection failed.",
      );
    } finally {
      setIsConnecting(false);
    }
  }, [expectedNetwork, syncWalletToSupabase]);

  const disconnect = useCallback(async () => {
    if (connection) {
      await syncWalletToSupabase(connection.address, connection.network, false, connection.walletType);
    }
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(DEMO_SECRET_STORAGE_KEY);
    }
    setConnection(null);
    setError(null);
  }, [connection, syncWalletToSupabase]);

  const getAddress = useCallback(() => connection?.address ?? null, [connection]);
  const getConnectedNetwork = useCallback(() => connection?.network ?? null, [connection]);

  const refreshBalance = useCallback(() => setBalanceVersion((v) => v + 1), []);

  const signTransaction = useCallback(
    async (transactionXdr: string): Promise<string | null> => {
      if (!connection) return null;

      const networkConfig = getNetworkConfig(
        connection.network as "stellar-testnet" | "stellar-mainnet",
      );

      // If connected via Freighter extension, use Freighter API.
      // Do NOT pass `address` — passing it causes Freighter to enforce that the
      // active Freighter account matches exactly, and if there is any mismatch
      // the signed XDR will have a wrong key which Stellar rejects as tx_bad_auth.
      // We only pass networkPassphrase so Freighter signs with whatever key is active.
      if (connection.walletType === "Freighter") {
        const result = await signFreighterTransaction(transactionXdr, {
          networkPassphrase: networkConfig.networkPassphrase,
        });
        if (result.error) return null;
        // Guard: make sure Freighter signed with the expected source account.
        // If the user has a different account active in Freighter the signature
        // would be valid for a different key and Stellar would return tx_bad_auth.
        if (
          result.signerAddress &&
          result.signerAddress !== connection.address
        ) {
          throw new Error(
            `Freighter signed with ${result.signerAddress.slice(0, 6)}… but your connected wallet is ${connection.address.slice(0, 6)}…. Switch the active account in Freighter to match and try again.`,
          );
        }
        return result.signedTxXdr;
      }

      // If connected with stored keypair (e.g. Testnet demo or manual with secret), sign directly
      if (typeof window !== "undefined") {
        const secret = window.sessionStorage.getItem(DEMO_SECRET_STORAGE_KEY);
        if (secret) {
          try {
            const keypair = Keypair.fromSecret(secret);
            const tx = TransactionBuilder.fromXDR(
              transactionXdr,
              networkConfig.networkPassphrase,
            );
            tx.sign(keypair);
            return tx.toXDR();
          } catch (signErr) {
            console.error("Direct signature failed:", signErr);
          }
        }
      }

      // If no secret key is in session, attempt Freighter fallback.
      // Same rule: omit `address` to avoid tx_bad_auth from a signer mismatch.
      try {
        const result = await signFreighterTransaction(transactionXdr, {
          networkPassphrase: networkConfig.networkPassphrase,
        });
        if (result.error) {
          throw new Error(
            "No signing key available for this wallet. On mobile, use 'Testnet Demo Wallet' for full signing & execution, or sign via an external Stellar wallet.",
          );
        }
        if (result.signerAddress && result.signerAddress !== connection.address) {
          throw new Error(
            `Freighter signed with ${result.signerAddress.slice(0, 6)}… but your connected wallet is ${connection.address.slice(0, 6)}…. Switch the active account in Freighter to match and try again.`,
          );
        }
        return result.signedTxXdr;
      } catch (fallbackErr) {
        if (fallbackErr instanceof Error) throw fallbackErr;
        throw new Error(
          "No signing key available for this wallet. On mobile, use 'Testnet Demo Wallet' for full signing & execution, or sign via an external Stellar wallet.",
        );
      }
    },
    [connection],
  );

  const value = useMemo<WalletContextValue>(
    () => ({
      connection,
      isConnected: Boolean(connection),
      connect,
      connectManual,
      connectTestnetDemo,
      connectMobileFreighter,
      disconnect,
      getAddress,
      getNetwork: getConnectedNetwork,
      signTransaction,
      warning: getWalletWarning(connection?.network, expectedNetwork),
      error,
      isFreighterAvailable,
      isMobile,
      isConnecting,
      balanceVersion,
      refreshBalance,
    }),
    [
      connect,
      connectManual,
      connectTestnetDemo,
      connectMobileFreighter,
      connection,
      disconnect,
      error,
      expectedNetwork,
      getAddress,
      getConnectedNetwork,
      isConnecting,
      isFreighterAvailable,
      isMobile,
      signTransaction,
      balanceVersion,
      refreshBalance,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}
