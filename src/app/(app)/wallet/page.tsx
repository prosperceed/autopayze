"use client";

import { useState } from "react";
import {
  ShieldCheck,
  TriangleAlert,
  Wallet,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WalletConnectButton } from "@/components/wallet/wallet-connect-button";
import { useWallet } from "@/providers/wallet-provider";
import { useWalletBalance } from "@/lib/use-wallet-balance";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";

export default function WalletPage() {
  const { isConnected, connection, balanceVersion, refreshBalance } = useWallet();
  const { balances, xlmBalance, loading, lastUpdated } = useWalletBalance(
    connection?.address ?? null,
    connection?.network ?? null,
    balanceVersion,
  );

  const [showFullAddress, setShowFullAddress] = useState(false);

  const networkLabel = connection?.network
    ? connection.network === "stellar-mainnet"
      ? "Stellar Mainnet"
      : "Stellar Testnet"
    : "Stellar Testnet";

  const horizonLink = connection?.address
    ? connection.network === "stellar-mainnet"
      ? `https://stellar.expert/explorer/public/account/${connection.address}`
      : `https://stellar.expert/explorer/testnet/account/${connection.address}`
    : null;

  return (
    <div className="space-y-5 sm:space-y-6 max-w-5xl px-3 sm:px-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Wallet</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Your Stellar wallet, balances, and full transaction history.
          </p>
        </div>
        <WalletConnectButton />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-2 text-sm sm:text-base">
              <span className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Wallet status
              </span>
              {isConnected ? (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Connected
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Disconnected</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-xs sm:text-sm">Network</span>
              <span className="font-medium text-foreground text-xs sm:text-sm">{networkLabel}</span>
            </div>

            {isConnected && connection && (
              <>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-muted-foreground text-xs sm:text-sm shrink-0">Address</span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => setShowFullAddress((v) => !v)}
                      className="font-mono text-[10px] sm:text-xs font-medium text-foreground truncate hover:text-primary transition-colors text-right"
                    >
                      {showFullAddress
                        ? connection.address
                        : `${connection.address.slice(0, 8)}…${connection.address.slice(-6)}`}
                    </button>
                    {horizonLink && (
                      <a
                        href={horizonLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="View on Stellar Expert"
                        className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground text-xs sm:text-sm">Type</span>
                  <span className="font-medium text-foreground text-xs sm:text-sm">
                    {connection.walletType === "TestnetDemo" ? "Testnet Demo" : connection.walletType}
                  </span>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Balances</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={refreshBalance}
                      disabled={loading}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                      aria-label="Refresh balance"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                  {loading && balances.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Loading…</p>
                  ) : balances.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No balances found.</p>
                  ) : (
                    balances.map((b) => (
                      <div key={b.asset} className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground">{b.assetCode}</span>
                        <span className="font-semibold tabular-nums text-sm text-foreground">
                          {b.balance}
                        </span>
                      </div>
                    ))
                  )}
                  {lastUpdated && (
                    <p className="text-[10px] text-muted-foreground/60">
                      Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              Non-custodial: private keys are never stored on Autopayze servers.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <TriangleAlert className="h-4 w-4 text-amber-500" />
              Verification & Network
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs sm:text-sm text-muted-foreground">
            <p>Wallet verification is limited to public address and network validation in this phase.</p>
            <p>Wrong-network wallets are flagged before any workflow proceeds.</p>
            <p>Account existence checks are performed via Stellar Horizon before building transactions.</p>
            {xlmBalance && (
              <div className="rounded-md border border-emerald-500/20 bg-emerald-500/8 px-3 py-2 text-emerald-700 dark:text-emerald-400">
                <span className="text-xs font-medium">Available: </span>
                <span className="text-sm font-bold tabular-nums">{xlmBalance} XLM</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isConnected && (
        <Card>
          <CardHeader className="pb-3 p-3 sm:p-5">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              Transaction history
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-5 pt-0">
            <RecentTransactions walletAddress={connection?.address ?? null} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
