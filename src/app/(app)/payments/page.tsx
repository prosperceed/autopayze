"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Zap,
  ExternalLink,
  RefreshCw,
  Bot,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { useNotification } from "@/components/ui/notification";
import { createClient } from "@/lib/supabase/client";
import { useWallet } from "@/providers/wallet-provider";
import Link from "next/link";

type PaymentRow = {
  id: string;
  created_at: string;
  action_type: string;
  amount: string | null;
  asset: string | null;
  recipient: string | null;
  status: string;
  tx_hash: string | null;
  summary: string | null;
  wallet_network: string | null;
  memo: string | null;
};

type Filter = "all" | "executed" | "accepted" | "failed";

const FILTER_LABELS: Record<Filter, string> = {
  all: "All",
  executed: "Executed",
  accepted: "Accepted",
  failed: "Failed",
};

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function explorerUrl(txHash: string, network: string | null) {
  const net = network === "stellar-mainnet" ? "public" : "testnet";
  return `https://stellar.expert/explorer/${net}/tx/${txHash}`;
}

export default function PaymentsPage() {
  const { connection } = useWallet();
  const { notify } = useNotification();
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const query = supabase
        .from("agent_transactions")
        .select(
          "id, created_at, action_type, amount, asset, recipient, status, tx_hash, summary, wallet_network, memo",
        )
        .eq("action_type", "payment")
        .order("created_at", { ascending: false })
        .limit(100);

      if (connection?.address) {
        query.eq("wallet_address", connection.address);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setRows((data ?? []) as PaymentRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load payments.");
      notify({ type: "error", title: "Load failed", message: "Could not fetch payment history." });
    } finally {
      setLoading(false);
    }
  }, [connection?.address, notify]);

  useEffect(() => {
    load();

    // Live updates
    const supabase = createClient();
    const channel = supabase
      .channel("payments-page")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agent_transactions" },
        () => { load(); },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  const counts = {
    all: rows.length,
    executed: rows.filter((r) => r.status === "executed").length,
    accepted: rows.filter((r) => r.status === "accepted").length,
    failed: rows.filter((r) => r.status === "failed").length,
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Payments
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            One-off and recurring transfers processed from your wallet.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
            aria-label="Refresh"
            className="gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Link href="/agent" className={buttonVariants({ size: "sm" }) + " gap-1.5"}>
            <Bot className="h-3.5 w-3.5" />
            New payment
          </Link>
        </div>
      </div>

      {/* Summary counts */}
      {!loading && rows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {(["all", "executed", "accepted", "failed"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-lg border p-2.5 sm:p-3 text-left transition-colors ${
                filter === f
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-card hover:bg-muted/30"
              }`}
            >
              <p className="text-lg sm:text-2xl font-bold tabular-nums text-foreground">
                {counts[f]}
              </p>
              <p className="mt-0.5 text-[10px] sm:text-xs font-medium text-muted-foreground capitalize">
                {FILTER_LABELS[f]}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader className="p-3 sm:p-5">
          <CardTitle className="text-sm sm:text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              Payment history
            </span>
            {filter !== "all" && (
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <Filter className="h-3 w-3" />
                Clear filter
              </button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-5 pt-0">
          {loading && <LoadingRows rows={5} />}

          {!loading && error && (
            <ErrorState
              description={error}
              retry={
                <Button variant="outline" size="sm" onClick={load}>
                  Try again
                </Button>
              }
            />
          )}

          {!loading && !error && filtered.length === 0 && (
            <EmptyState
              icon={Zap}
              title={filter !== "all" ? `No ${filter} payments` : "No payments yet"}
              description={
                filter !== "all"
                  ? "No payments match this filter."
                  : "Use the AI agent to send your first payment. It will appear here after you approve."
              }
              action={
                filter !== "all" ? (
                  <Button variant="outline" size="sm" onClick={() => setFilter("all")}>
                    Show all
                  </Button>
                ) : (
                  <Link href="/agent" className={buttonVariants({ size: "sm" }) + " mt-2 gap-1.5"}>
                    <Bot className="h-3.5 w-3.5" />
                    Open agent
                  </Link>
                )
              }
            />
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="space-y-2">
              {/* Desktop column headers */}
              <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto_auto] gap-3 pb-2 border-b border-border/40 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Payment</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Date</span>
                <span className="text-right">Status</span>
                <span className="text-right">Tx</span>
              </div>

              {filtered.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-col sm:grid sm:grid-cols-[1fr_auto_auto_auto_auto] gap-2 sm:gap-3 rounded-lg border border-border/50 bg-muted/20 p-3 hover:bg-muted/30 transition-colors"
                >
                  {/* Recipient + summary */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-xs font-medium text-foreground">
                        {row.recipient ? short(row.recipient) : "Unknown"}
                      </span>
                      {row.memo && (
                        <span className="text-[10px] text-muted-foreground italic truncate max-w-[100px]">
                          &ldquo;{row.memo}&rdquo;
                        </span>
                      )}
                    </div>
                    {row.summary && (
                      <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-1">{row.summary}</p>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <span className="text-xs sm:hidden font-medium text-muted-foreground">Amount</span>
                    <span className="font-semibold tabular-nums text-sm text-foreground whitespace-nowrap">
                      {row.amount ?? "—"} {row.asset ?? "XLM"}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <span className="text-xs sm:hidden font-medium text-muted-foreground">Date</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(row.created_at).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <span className="text-xs sm:hidden font-medium text-muted-foreground">Status</span>
                    <StatusBadge status={row.status} />
                  </div>

                  {/* Tx link */}
                  <div className="flex items-center justify-end">
                    {row.tx_hash ? (
                      <a
                        href={explorerUrl(row.tx_hash, row.wallet_network)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="View on Stellar Expert"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground pr-2">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
