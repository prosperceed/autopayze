"use client";

import { Button } from '@/components/ui/button';
import { useWallet } from '@/providers/wallet-provider';

export function WalletConnectButton() {
  const { isConnected, connect, disconnect } = useWallet();

  return isConnected ? (
    <Button variant="outline" onClick={disconnect}>Disconnect wallet</Button>
  ) : (
    <Button onClick={connect}>Connect wallet</Button>
  );
}
