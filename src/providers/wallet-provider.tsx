"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getNetwork as getFreighterNetwork,
  requestAccess,
  signTransaction as signFreighterTransaction,
} from "@stellar/freighter-api";
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

export function WalletProvider({ children }: { children: ReactNode }) {
  const expectedNetwork = getConfiguredNetwork();
  const [connection, setConnection] = useState<WalletConnection | null>(null);
  const [error, setError] = useState<string | null>(null);

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

      setConnection({
        address: addressResult.address.trim(),
        network: resolvedNetwork,
        walletType: "Freighter",
        connectedAt: new Date().toISOString(),
      });
    } catch (connectionError) {
      setError(connectionError instanceof Error ? connectionError.message : "walletUnavailable");
    }
  }, [expectedNetwork]);

  const disconnect = useCallback(() => {
    setConnection(null);
    setError(null);
  }, []);

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
