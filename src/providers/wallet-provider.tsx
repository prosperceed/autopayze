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
import { createClient } from "@/lib/supabase/client";
import { getNetworkConfig } from "@/lib/stellar/client";
import { getConfiguredNetwork } from "@/lib/stellar/network";
import {
  detectWalletNetwork,
  getWalletWarning,
  isWalletAddressValid,
} from "@/lib/stellar/wallet";

export type WalletConnection = {
  address: string;
  network: string;
  walletType: string;
  connectedAt: string;
};

export type WalletContextValue = {
  connection: WalletConnection | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  getAddress: () => string | null;
  getNetwork: () => string | null;
  signTransaction: (transactionXdr: string) => Promise<string | null>;
  warning: string | null;
  error: string | null;
};

const WalletContext = createContext<WalletContextValue | null>(null);
const WALLET_STORAGE_KEY = "autopayze-wallet-state";

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
      walletType: parsed.walletType ?? "Freighter",
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (connection) {
      window.localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(connection));
      return;
    }
    window.localStorage.removeItem(WALLET_STORAGE_KEY);
  }, [connection]);

  const syncWalletToSupabase = useCallback(async (walletAddress: string, walletNetwork: string, active: boolean) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from("wallets").upsert(
      {
        user_id: user.id,
        address: walletAddress,
        network: walletNetwork,
        wallet_type: "Freighter",
        is_active: active,
        connected_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (error) {
      console.error("Wallet sync failed:", error.message);
    }
  }, []);

  const connect = useCallback(async () => {
    setError(null);

    try {
      const addressResult = await requestAccess();
      if (addressResult.error || !isWalletAddressValid(addressResult.address)) {
        throw new Error(addressResult.error ? "walletUnavailable" : "invalidAddress");
      }

      const networkResult = await getFreighterNetwork();
      const resolvedNetwork = detectWalletNetwork(networkResult.network);
      if (networkResult.error || !resolvedNetwork || resolvedNetwork !== expectedNetwork) {
        throw new Error("wrongNetwork");
      }

      const nextConnection = {
        address: addressResult.address.trim(),
        network: resolvedNetwork,
        walletType: "Freighter",
        connectedAt: new Date().toISOString(),
      };

      setConnection(nextConnection);
      await syncWalletToSupabase(nextConnection.address, nextConnection.network, true);
      window.localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(nextConnection));
    } catch (connectionError) {
      setError(connectionError instanceof Error ? connectionError.message : "walletUnavailable");
    }
  }, [expectedNetwork, syncWalletToSupabase]);

  const disconnect = useCallback(async () => {
    if (connection) {
      await syncWalletToSupabase(connection.address, connection.network, false);
    }
    setConnection(null);
    setError(null);
  }, [connection, syncWalletToSupabase]);

  const getAddress = useCallback(() => connection?.address ?? null, [connection]);
  const getConnectedNetwork = useCallback(() => connection?.network ?? null, [connection]);

  const signTransaction = useCallback(async (transactionXdr: string) => {
    if (!connection) return null;
    const result = await signFreighterTransaction(transactionXdr, {
      address: connection.address,
      networkPassphrase: getNetworkConfig(connection.network as "stellar-testnet" | "stellar-mainnet").networkPassphrase,
    });
    return result.error ? null : result.signedTxXdr;
  }, [connection]);

  const value = useMemo<WalletContextValue>(() => ({
    connection,
    isConnected: Boolean(connection),
    connect,
    disconnect,
    getAddress,
    getNetwork: getConnectedNetwork,
    signTransaction,
    warning: getWalletWarning(connection?.network, expectedNetwork),
    error,
  }), [connect, connection, disconnect, error, expectedNetwork, getConnectedNetwork, signTransaction]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}
