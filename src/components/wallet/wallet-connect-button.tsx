"use client";

import { Button } from '@/components/ui/button';
import { useWallet } from '@/providers/wallet-provider';

export function WalletConnectButton() {
  const { isConnected, connect, disconnect, error } = useWallet();

  return (
    <div className="space-y-2">
      {isConnected ? (
        <Button variant="outline" onClick={disconnect}>Disconnect wallet</Button>
      ) : (
        <Button onClick={connect}>Connect wallet</Button>
      )}
      {error ? <p className="text-sm text-destructive">Unable to connect wallet. Check that Freighter is installed and unlocked.</p> : null}
    </div>
  );
}
