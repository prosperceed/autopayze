"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Wallet2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/providers/wallet-provider";
import { WalletConnectModal } from "./wallet-connect-modal";

function shortAddress(address: string) {
  if (!address) return "Not connected";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletConnectionCard() {
  const { connection, isConnected, warning, disconnect, error } = useWallet();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Wallet2 className="h-4 w-4" /> Wallet
            </span>
            {isConnected ? (
              <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
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
                <div className="mt-1 flex items-center justify-between">
                  <p className="font-mono text-sm font-medium text-foreground">{shortAddress(connection!.address)}</p>
                  <span className="rounded bg-muted px-2 py-0.5 text-[10px] uppercase font-semibold text-muted-foreground">
                    {connection!.walletType === "TestnetDemo" ? "Demo" : connection!.walletType}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Network</p>
                <p className="mt-1 font-medium text-foreground capitalize">{connection!.network.replace("-", " ")}</p>
              </div>
              {warning ? (
                <div className="flex items-start gap-2 rounded-md border border-warning/50 bg-warning/10 p-3 text-sm text-warning">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
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
                Connect your Stellar wallet to start making payments and activating the AI agent.
              </p>
              <Button onClick={() => setModalOpen(true)} className="w-full gap-2">
                <Sparkles className="h-4 w-4" />
                Connect Stellar wallet
              </Button>
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <WalletConnectModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
