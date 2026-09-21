'use client';

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Transaction {
  id: string;
  created_at: string;
  amount: string;
  asset: string;
  recipient: string;
  status: string;
  tx_hash: string | null;
  action_type: string;
  summary: string;
  prompt_text: string;
}

export default function ActivityPage() {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from("agent_transactions")
          .select("id, created_at, amount, asset, recipient, status, tx_hash, action_type, summary, prompt_text")
          .order("created_at", { ascending: false });

        if (fetchError) {
          console.error("Failed to fetch transactions", fetchError);
          setError("Failed to load activity");
          setTransactions([]);
          return;
        }

        setTransactions((data as Transaction[]) || []);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();

    // Set up real-time subscription
    const supabase = createClient();
    const channel = supabase
      .channel("activity_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "agent_transactions",
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("agent_transactions")
        .select("id, created_at, amount, asset, recipient, status, tx_hash, action_type, summary, prompt_text")
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError("Failed to load activity");
        setTransactions([]);
      } else {
        setTransactions((data as Transaction[]) || []);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Activity
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            A full history of payments, schedules and airdrops on your account.
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Activity
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            A full history of payments, schedules and airdrops on your account.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 gap-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Activity
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            A full history of payments, schedules and airdrops on your account.
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <EmptyState
              icon={Activity}
              title="No activity yet"
              emptyTitle="No activity yet"
              description="Every transaction Autopayze sends on your behalf will be logged here, with a timestamp and status."
              emptyDescription="Every transaction Autopayze sends on your behalf will be logged here, with a timestamp and status."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1">
          <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Activity
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            A full history of payments, schedules and airdrops on your account.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="gap-2 shrink-0"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      <div className="space-y-3">
        {transactions.map((tx) => (
          <Card key={tx.id} className="hover:border-primary/50 transition-colors">
            <CardContent className="p-3 sm:p-5">
              <div className="space-y-3">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/50 pb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-foreground">
                      {tx.amount} {tx.asset}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                      {tx.summary}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-[9px] sm:text-xs font-medium whitespace-nowrap ${
                        tx.status === "accepted"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : tx.status === "executed"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : tx.status === "rejected"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  <div>
                    <p className="text-[9px] sm:text-xs uppercase font-semibold text-muted-foreground">
                      Type
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-foreground capitalize mt-1">
                      {tx.action_type.replace("_", " ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-xs uppercase font-semibold text-muted-foreground">
                      Recipient
                    </p>
                    <p className="text-[9px] sm:text-xs font-mono text-foreground truncate mt-1">
                      {tx.recipient?.slice(0, 10)}...
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-xs uppercase font-semibold text-muted-foreground">
                      Date
                    </p>
                    <p className="text-xs sm:text-sm text-foreground mt-1">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-xs uppercase font-semibold text-muted-foreground">
                      Time
                    </p>
                    <p className="text-xs sm:text-sm text-foreground mt-1">
                      {new Date(tx.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {/* Prompt Section */}
                <div className="rounded-lg bg-muted/30 p-2.5 sm:p-3 border border-border/50">
                  <p className="text-[9px] sm:text-xs uppercase font-semibold text-muted-foreground mb-1">
                    Prompt
                  </p>
                  <p className="text-[10px] sm:text-xs text-foreground line-clamp-2">
                    "{tx.prompt_text}"
                  </p>
                </div>

                {/* Action Links */}
                <div className="flex gap-2">
                  {tx.tx_hash && (
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${tx.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs sm:text-sm text-primary hover:text-primary/80 font-medium"
                    >
                      <span>View on Stellar</span>
                      <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
