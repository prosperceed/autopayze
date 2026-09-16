"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getConfiguredNetwork, isExpectedNetwork } from '@/lib/stellar/network';
import { getWalletWarning, isWalletAddressValid } from '@/lib/stellar/wallet';

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
  signTransaction: () => Promise<string | null>;
  warning: string | null;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const expectedNetwork = getConfiguredNetwork();
  const [connection, setConnection] = useState<WalletConnection | null>(null);

  const connect = useCallback(async () => {
    const wallet = (window as typeof window & { freighter?: { getAddress?: () => Promise<string>; getNetwork?: () => Promise<string>; signTransaction?: () => Promise<string> } }).freighter;

    if (!wallet || typeof wallet.getAddress !== 'function') {
      throw new Error('walletUnavailable');
    }

    const address = await wallet.getAddress();
    if (!isWalletAddressValid(address)) {
      throw new Error('invalidAddress');
    }

    const network = await wallet.getNetwork?.();
    const resolvedNetwork = network ?? expectedNetwork;
    if (!isExpectedNetwork(resolvedNetwork)) {
      throw new Error('wrongNetwork');
    }

    setConnection({
      address,
      network: resolvedNetwork,
      walletType: 'Freighter',
      connectedAt: new Date().toISOString(),
    });
  }, [expectedNetwork]);

  const disconnect = useCallback(() => {
    setConnection(null);
  }, []);

  const getAddress = useCallback(() => connection?.address ?? null, [connection]);
  const getNetwork = useCallback(() => connection?.network ?? null, [connection]);

  const signTransaction = useCallback(async () => {
    if (!connection) return null;
    const wallet = (window as typeof window & { freighter?: { signTransaction?: () => Promise<string> } }).freighter;
    if (!wallet?.signTransaction) return null;
    return wallet.signTransaction();
  }, [connection]);

  const value = useMemo<WalletContextValue>(() => ({
    connection,
    isConnected: Boolean(connection),
    connect,
    disconnect,
    getAddress,
    getNetwork,
    signTransaction,
    warning: getWalletWarning(connection?.network, expectedNetwork),
  }), [connect, connection, disconnect, expectedNetwork, getAddress, getNetwork, signTransaction]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}
