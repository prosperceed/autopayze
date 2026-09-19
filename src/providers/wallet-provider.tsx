"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
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
  disconnect: () => void;
  getAddress: () => string | null;
  getNetwork: () => string | null;
  signTransaction: (transactionXdr: string) => Promise<string | null>;
  warning: string | null;
  error: string | null;
  isFreighterAvailable: boolean;
  isConnecting: boolean;
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasFreighter = Boolean(
        (window as unknown as { freighter?: unknown }).freighter,
      );
      setIsFreighterAvailable(hasFreighter);
    }
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
    } catch (demoError) {
      setError(demoError instanceof Error ? demoError.message : "Failed to initialize testnet demo wallet.");
      throw demoError;
    } finally {
      setIsConnecting(false);
    }
  }, [syncWalletToSupabase]);

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

  const signTransaction = useCallback(
    async (transactionXdr: string): Promise<string | null> => {
      if (!connection) return null;

      const networkConfig = getNetworkConfig(
        connection.network as "stellar-testnet" | "stellar-mainnet",
      );

      // If connected via Freighter extension, use Freighter API
      if (connection.walletType === "Freighter") {
        const result = await signFreighterTransaction(transactionXdr, {
          address: connection.address,
          networkPassphrase: networkConfig.networkPassphrase,
        });
        return result.error ? null : result.signedTxXdr;
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

      // If no secret key is in session, attempt Freighter fallback
      try {
        const result = await signFreighterTransaction(transactionXdr, {
          address: connection.address,
          networkPassphrase: networkConfig.networkPassphrase,
        });
        return result.error ? null : result.signedTxXdr;
      } catch {
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
      disconnect,
      getAddress,
      getNetwork: getConnectedNetwork,
      signTransaction,
      warning: getWalletWarning(connection?.network, expectedNetwork),
      error,
      isFreighterAvailable,
      isConnecting,
    }),
    [
      connect,
      connectManual,
      connectTestnetDemo,
      connection,
      disconnect,
      error,
      expectedNetwork,
      getAddress,
      getConnectedNetwork,
      isConnecting,
      isFreighterAvailable,
      signTransaction,
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
