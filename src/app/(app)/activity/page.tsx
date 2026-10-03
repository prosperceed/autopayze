"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import { Activity, ExternalLink, RefreshCw, Zap, Calendar, Gift, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type Transaction = {
  id: string;
  created_at: string;
  amount: string | null;
  asset: string | null;
  recipient: string | null;
  status: string;
  tx_hash: string | null;
  action_type: string;
  summary: string | null;
  prompt_text: string | null;
  wallet_network: string | null;
};

const ACTION_META: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  payment:          { icon: Zap,      label: "Payment",  color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  schedule_payment: { icon: Calendar, label: "Schedule", color: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  airdrop:          { icon: Gift,     label: "Airdrop",  color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
};

const STATUS_COLOR: Record<string, string> = {
  executed:        "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
  accepted:        "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20",
  review_required: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20",
  rejected:        "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
  failed:          "bg-destructive/10 text-destructive border border-destructive/20",
};

function explorerUrl(txHash: string, network: string | null) {
  const base = network === "stellar-mainnet"
    ? "https://stellar.expert/explorer/public/tx"
    : "https://stellar.expert/explorer/testnet/tx";
  return `${base}/${txHash}`;
}

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function ActivityPage() {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("agent_transactions")
        .select("id, created_at, amount, asset, recipient, status, tx_hash, action_type, summary, prompt_text, wallet_network")
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError("Failed to load activity.");
        setTransactions([]);
      } else {
        setTransactions((data as Transaction[]) ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      void loadTransactions();
    });

    const supabase = createClient();
    const channel = supabase
      .channel("activity_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "agent_transactions" }, () => {
        startTransition(() => {
          void loadTransactions();
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadTransactions]);

  const header = (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
      <div className="flex-1">
        <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Activity</h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Every transaction executed on your behalf, with live Stellar blockchain links.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={loadTransactions} disabled={loading} className="gap-2 shrink-0">
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        <span className="hidden sm:inline">Refresh</span>
      </Button>
    </div>
  );

  if (loading && !transactions) {
    return (
      <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
        {header}
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
        {header}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 gap-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={loadTransactions} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
        {header}
        <Card>
          <CardContent className="flex items-center justify-center py-14">
            <EmptyState
              icon={Activity}
              title="No activity yet"
              description="Every transaction Autopayze executes on your behalf will appear here with a Stellar blockchain link."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
      {header}

      <div className="space-y-2 sm:space-y-3">
        {transactions.map((tx) => {
          const meta = ACTION_META[tx.action_type] ?? ACTION_META.payment;
          const Icon = meta.icon;
          const statusClass = STATUS_COLOR[tx.status] ?? "bg-muted text-muted-foreground border border-border";

          return (
            <Card key={tx.id} className="hover:border-primary/40 transition-colors">
              <CardContent className="p-3 sm:p-4 lg:p-5">
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.color}`}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.color}`}>
                        {meta.label}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusClass}`}>
                        {tx.status.replace("_", " ")}
                      </span>
                      <time
                        dateTime={tx.created_at}
                        className="ml-auto text-[10px] text-muted-foreground/70 whitespace-nowrap"
                      >
                        {new Date(tx.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                        {" "}
                        {new Date(tx.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </time>
                    </div>

                    {tx.amount && (
                      <p className="text-sm font-semibold text-foreground tabular-nums">
                        {tx.amount} {tx.asset ?? "XLM"}
                        {tx.recipient && (
                          <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
                            → {short(tx.recipient)}
                          </span>
                        )}
                      </p>
                    )}

                    {tx.summary && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{tx.summary}</p>
                    )}

                    {tx.prompt_text && (
                      <div className="rounded-md bg-muted/40 border border-border/50 px-2.5 py-2">
                        <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Prompt</p>
                        <p className="text-[11px] sm:text-xs text-foreground line-clamp-2">&ldquo;{tx.prompt_text}&rdquo;</p>
                      </div>
                    )}

                    {tx.tx_hash && (
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[200px] sm:max-w-xs">
                          {tx.tx_hash.slice(0, 16)}…{tx.tx_hash.slice(-8)}
                        </span>
                        <a
                          href={explorerUrl(tx.tx_hash, tx.wallet_network)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors whitespace-nowrap"
                        >
                          View on Stellar
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
