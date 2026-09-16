"use client";

import { AlertTriangle, CheckCircle2, Wallet2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/providers/wallet-provider';

function shortAddress(address: string) {
  if (!address) return 'Not connected';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletConnectionCard() {
  const { connection, isConnected, warning, connect, disconnect } = useWallet();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Wallet2 className="h-4 w-4" /> Wallet
          </span>
          {isConnected ? (
            <span className="inline-flex items-center gap-1 text-xs text-success">
              <CheckCircle2 className="h-3.5 w-3.5" /> Connected
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Disconnected</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <>
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="mt-1 font-medium text-foreground">{shortAddress(connection!.address)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Network</p>
              <p className="mt-1 font-medium text-foreground">{connection!.network}</p>
            </div>
            {warning ? (
              <div className="flex items-start gap-2 rounded-md border border-warning/50 bg-warning/10 p-3 text-sm text-warning">
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                <span>{warning}</span>
              </div>
            ) : null}
            <Button variant="outline" onClick={disconnect} className="w-full">
              Disconnect wallet
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Connect your Stellar wallet to start making payments.
            </p>
            <Button onClick={connect} className="w-full">
              Connect Stellar wallet
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
