"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, TriangleAlert, Wallet, CheckCircle2, Sparkles, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletConnectButton } from "@/components/wallet/wallet-connect-button";
import { useWallet } from "@/providers/wallet-provider";
import { fetchAccountInfo } from "@/lib/stellar/wallet";

export default function WalletPage() {
  const { isConnected, connection } = useWallet();
  const [balance, setBalance] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  useEffect(() => {
    async function checkBalance() {
      if (!connection?.address) {
        setBalance(null);
        return;
      }

      setLoadingBalance(true);
      try {
        const info = await fetchAccountInfo(
          connection.address,
          (connection.network as "stellar-testnet" | "stellar-mainnet") || "stellar-testnet",
        );
        const native = info.balances.find((b) => b.asset_type === "native");
        setBalance(native ? `${native.balance} XLM` : "0 XLM");
      } catch {
        setBalance("Not funded yet / 0 XLM");
      } finally {
        setLoadingBalance(false);
      }
    }

    void checkBalance();
  }, [connection?.address, connection?.network]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Wallet
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect and verify your Stellar Testnet wallet before making payments.
          </p>
        </div>
        <WalletConnectButton />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Wallet status
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
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Network</span>
              <span className="font-medium text-foreground capitalize">
                {connection?.network ? connection.network.replace("-", " ") : "Stellar Testnet"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium text-foreground">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
            {isConnected && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Address</span>
                  <span className="font-mono text-xs font-medium text-foreground truncate max-w-[200px] sm:max-w-[300px]">
                    {connection?.address}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Wallet Type</span>
                  <span className="font-medium text-foreground">
                    {connection?.walletType === "TestnetDemo" ? "Testnet Demo (In-Memory Keypair)" : connection?.walletType}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Balance</span>
                  <span className="font-semibold text-foreground">
                    {loadingBalance ? "Checking..." : balance ?? "Loading..."}
                  </span>
                </div>
              </>
            )}
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
              Non-custodial: private keys are never stored on Autopayze servers.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TriangleAlert className="h-4 w-4 text-warning" /> Verification & Network
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Wallet verification is actively enforced on the public address and network context before transaction execution.</p>
            <p>Wrong-network wallets are blocked from signing to prevent accidental mainnet/testnet mismatches.</p>
            <p>Account existence and minimum balances on Stellar are checked before dispatching payment transactions.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
