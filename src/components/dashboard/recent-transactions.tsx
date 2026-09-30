"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Calendar, Zap, Gift, ExternalLink } from "lucide-react";

type Tx = {
  id: string;
  created_at: string;
  action_type: "payment" | "schedule_payment" | "airdrop";
  amount: string | null;
  asset: string | null;
  recipient: string | null;
  status: string;
  tx_hash: string | null;
  summary: string | null;
};

const ACTION_META = {
  payment:          { icon: Zap,      label: "Payment",  badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  schedule_payment: { icon: Calendar, label: "Schedule", badge: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  airdrop:          { icon: Gift,     label: "Airdrop",  badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
};

const STATUS_CLASS: Record<string, string> = {
  executed:        "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  accepted:        "bg-green-500/10 text-green-700 dark:text-green-400",
  review_required: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  rejected:        "bg-red-500/10 text-red-600 dark:text-red-400",
  failed:          "bg-destructive/10 text-destructive",
};

function short(address: string) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function RecentTransactions({ walletAddress }: { walletAddress: string | null }) {
  const [rows, setRows] = useState<Tx[] | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    const supabase = createClient();

    const fetch = async () => {
      setLoading(true);
      const query = supabase
        .from("agent_transactions")
        .select("id, created_at, action_type, amount, asset, recipient, status, tx_hash, summary")
        .order("created_at", { ascending: false })
        .limit(8);

      if (walletAddress) query.eq("wallet_address", walletAddress);

      const { data, error } = await query;
      if (!error) setRows((data ?? []) as Tx[]);
      setLoading(false);
    };

    fetchRef.current = fetch;
    fetch();

    const channel = supabase
      .channel("rt-transactions")
      .on("postgres_changes", { event: "*", schema: "public", table: "agent_transactions" }, () => {
        fetchRef.current();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [walletAddress]);

  if (loading && !rows) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return <p className="text-xs sm:text-sm text-muted-foreground py-2">No activity yet. Use the agent to create your first payment.</p>;
  }

  return (
    <ul className="space-y-2">
      {rows.map((tx) => {
        const meta = ACTION_META[tx.action_type] ?? ACTION_META.payment;
        const Icon = meta.icon;
        const statusClass = STATUS_CLASS[tx.status] ?? "bg-muted text-muted-foreground";

        return (
          <li
            key={tx.id}
            className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/20 p-2.5 sm:p-3 hover:bg-muted/40 transition-colors"
          >
            {/* Action icon */}
            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${meta.badge}`}>
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Action type badge */}
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.badge}`}>
                  {meta.label}
                </span>
                {/* Status badge */}
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusClass}`}>
                  {tx.status.replace("_", " ")}
                </span>
                {tx.tx_hash && (
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${tx.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                    aria-label="View on Stellar Expert"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {/* Amount + asset */}
              {tx.amount && (
                <p className="mt-1 text-xs font-semibold text-foreground tabular-nums">
                  {tx.amount} {tx.asset ?? "XLM"}
                  {tx.recipient && (
                    <span className="ml-1.5 font-mono font-normal text-muted-foreground">
                      → {short(tx.recipient)}
                    </span>
                  )}
                </p>
              )}

              {/* Summary */}
              {tx.summary && (
                <p className="mt-0.5 text-[10px] sm:text-xs text-muted-foreground line-clamp-1">{tx.summary}</p>
              )}
            </div>

            {/* Timestamp */}
            <time
              dateTime={tx.created_at}
              className="shrink-0 text-[10px] text-muted-foreground/60 whitespace-nowrap mt-0.5"
            >
              {new Date(tx.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
            </time>
          </li>
        );
      })}
    </ul>
  );
}
