"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Send,
  Loader2,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useWallet } from "@/providers/wallet-provider";
import { useNotification } from "@/components/ui/notification";
import { saveTransactionHistory } from "@/lib/agent-history";
import {
  buildPaymentTransaction,
  submitPaymentTransaction,
} from "@/lib/stellar/transaction";
import { WalletConnectButton } from "@/components/wallet/wallet-connect-button";

export type SessionItem = {
  id: string;
  prompt: string;
  timestamp: string;
  summary: string;
  action: string;
  status: "planned" | "approved" | "signed" | "executed" | "rejected" | "failed";
  details?: Record<string, unknown>;
  transactionId?: string | null;
  txHash?: string | null;
  error?: string | null;
  isExecuting?: boolean;
};

const SESSION_STORAGE_KEY = "autopayze-agent-session-history";

const examplePrompts = [
  "Send 1 XLM to GC3PDOUDFWWA24GUQKARUOTK3MDZB6SPI4C5FH3FLMIULM3B3VSHCVVP",
  "Send 5 XLM to GC6VO656MIL7C4VS3MG55K7XD2NJVYJ6L5SH6IJQBXGAAWBJ4KZCJXXH with memo 'Invoice 101'",
  "Schedule weekly payment of 10 XLM to GC3PDOUDFWWA24GUQKARUOTK3MDZB6SPI4C5FH3FLMIULM3B3VSHCVVP",
];

export default function AgentPage() {
  const { isConnected, connection, signTransaction } = useWallet();
  const { notify } = useNotification();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SessionItem[]>([]);

  // Load session history from localStorage
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save session history to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  function clearHistory() {
    setHistory([]);
    try {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // ignore
    }
    notify({
      type: "info",
      title: "History cleared",
      message: "Agent session conversation has been reset.",
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isConnected || !connection) {
      setError("Connect and confirm your wallet before activating the agent.");
      return;
    }

    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setError("Write a prompt for the agent first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmedPrompt,
          wallet: {
            address: connection.address,
            network: connection.network,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "The agent could not process your request.");
      }

      const newItem: SessionItem = {
        id: data.transactionId || `session-${Date.now()}`,
        prompt: trimmedPrompt,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        summary: data.summary,
        action: data.action,
        status: "planned",
        details: data.details ?? {},
        transactionId: data.transactionId ?? null,
      };

      // Save transaction plan to Supabase for later realtime tracking
      const transactionEntry = {
        user_id: connection?.address ?? '',
        wallet_address: connection?.address ?? '',
        wallet_network: connection?.network ?? '',
        action_type: data.action as any,
        prompt_text: trimmedPrompt,
        summary: data.summary,
        intent_payload: data.details ?? {},
        status: 'accepted' as const,
        amount: data.details?.amount ?? null,
        recipient: data.details?.recipient ?? null,
        asset: data.details?.asset ?? null,
        memo: data.details?.memo ?? null,
        tx_hash: null,
      };
      void saveTransactionHistory(transactionEntry).catch((e) => console.warn('Failed to save transaction history', e));

      setPrompt("");
      notify({
        type: "success",
        title: "Agent action parsed",
        message: data.summary,
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The agent could not process your request.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveAndExecute(item: SessionItem) {
    if (!connection) return;

    // Update item status to executing
    setHistory((prev) =>
      prev.map((h) => (h.id === item.id ? { ...h, isExecuting: true, error: null } : h)),
    );

    try {
      const details = item.details as {
        recipient?: string;
        amount?: string;
        asset?: "XLM" | "USDC" | "USDT";
        network?: "stellar-testnet" | "stellar-mainnet";
        memo?: string | null;
      };

      if (!details?.recipient || !details?.amount) {
        throw new Error("This payment plan is missing destination address or amount.");
      }

      const network = (details.network ?? connection.network) as
        | "stellar-testnet"
        | "stellar-mainnet";

      // 1. Build payment transaction
      const draft = await buildPaymentTransaction({
        sourceAddress: connection.address,
        destinationAddress: details.recipient,
        amount: details.amount,
        asset: details.asset ?? "XLM",
        network,
        memo: details.memo ?? null,
      });

      // 2. Sign transaction via connected wallet
      notify({
        type: "info",
        title: "Awaiting signature",
        message: "Signing transaction with your connected wallet...",
      });

      const signedXdr = await signTransaction(draft.xdr);
      if (!signedXdr) {
        throw new Error("Transaction signature was cancelled or rejected by wallet.");
      }

      // 3. Submit transaction to Stellar Horizon
      notify({
        type: "info",
        title: "Executing on Stellar",
        message: "Submitting signed transaction to Stellar Testnet...",
      });

      const submitResult = await submitPaymentTransaction(signedXdr, network);

      if (!submitResult.successful) {
        throw new Error(submitResult.error || "Transaction submission failed on Stellar.");
      }

      // 4. Update transaction status in Supabase
      if (item.transactionId) {
        void fetch("/api/agent/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionId: item.transactionId,
            status: "executed",
            txHash: submitResult.hash,
          }),
        }).catch((e) => console.warn("Could not sync execution to DB:", e));
      }

      // 5. Update local session item state
      setHistory((prev) =>
        prev.map((h) =>
          h.id === item.id
            ? {
                ...h,
                status: "executed",
                txHash: submitResult.hash,
                isExecuting: false,
              }
            : h,
        ),
      );

      notify({
        type: "success",
        title: "Transaction executed!",
        message: `Payment confirmed on Stellar! Hash: ${submitResult.hash.slice(0, 8)}...`,
      });
    } catch (execError) {
      const msg =
        execError instanceof Error ? execError.message : "Execution could not be completed.";

      setHistory((prev) =>
        prev.map((h) =>
          h.id === item.id
            ? {
                ...h,
                status: "failed",
                error: msg,
                isExecuting: false,
              }
            : h,
        ),
      );

      notify({
        type: "error",
        title: "Execution failed",
        message: msg,
      });
    }
  }

  function handleReject(itemId: string) {
    setHistory((prev) =>
      prev.map((h) => (h.id === itemId ? { ...h, status: "rejected" } : h)),
    );
    notify({
      type: "info",
      title: "Plan rejected",
      message: "The proposed payment plan has been marked as rejected.",
    });
  }

  return (
    <div className="flex h-full flex-col gap-4 sm:gap-6 max-w-4xl mx-auto w-full px-3 sm:px-4 md:px-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            AI agent
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground line-clamp-2">
            Tell the agent what payment to plan. It prepares the transaction, asks for your explicit approval, and executes directly on Stellar.
          </p>
        </div>
        {history.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearHistory}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clear history</span>
            <span className="sm:hidden">Clear</span>
          </Button>
        )}
      </div>

      <Card className="flex flex-1 flex-col border-border w-full max-w-full">
        <CardContent className="flex flex-1 flex-col p-3 sm:p-4 md:p-6">
          {!isConnected ? (
            <div className="flex flex-1 flex-col items-center justify-center py-12">
              <EmptyState
                icon={Bot}
                title="Agent not connected yet"
                description="Connect and verify your Stellar wallet before the agent can plan and execute payments."
              />
              <div className="mt-4">
                <WalletConnectButton size="md" />
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col gap-4">
              {/* Wallet connection banner */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 p-2.5 sm:p-3 text-xs text-primary">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span className="truncate text-[11px] sm:text-xs">
                    Connected:{" "}
                    <strong className="font-mono">
                      {connection?.address.slice(0, 4)}...{connection?.address.slice(-3)}
                    </strong>{" "}
                    <span className="hidden sm:inline">({connection?.walletType === "TestnetDemo" ? "Demo" : connection?.walletType})</span>
                  </span>
                </div>
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-1 font-medium uppercase tracking-wider text-[9px] sm:text-[10px] shrink-0">
                  {connection?.network}
                </span>
              </div>

              {/* Example prompt pills */}
              {history.length === 0 && (
                <div className="space-y-2 py-2">
                  <p className="text-[11px] sm:text-xs font-medium text-muted-foreground">Try an example prompt:</p>
                  <div className="flex flex-col gap-1.5 sm:gap-2">
                    {examplePrompts.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPrompt(p)}
                        className="rounded-lg border border-border bg-muted/30 px-2.5 sm:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs text-foreground transition-colors hover:bg-muted hover:border-primary/40 line-clamp-2"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Session History Stream */}
              <div className="space-y-3 sm:space-y-4 overflow-y-auto flex-1 max-h-[500px] sm:max-h-[550px] pr-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg sm:rounded-xl border border-border bg-card p-2.5 sm:p-4 text-xs sm:text-sm text-foreground shadow-sm space-y-2.5 sm:space-y-3"
                  >
                    {/* User Prompt Header */}
                    <div className="flex items-start justify-between gap-1.5 sm:gap-2 border-b border-border/60 pb-2">
                      <div className="flex items-start gap-1.5 sm:gap-2 min-w-0 flex-1">
                        <div className="flex h-5 sm:h-6 w-5 sm:w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs shrink-0">
                          <Bot className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </div>
                        <span className="font-medium text-[10px] sm:text-sm text-foreground line-clamp-2 break-words">
                          {item.prompt}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
                          <Clock className="h-2.5 sm:h-3 w-2.5 sm:w-3" />
                          <span className="hidden sm:inline">{item.timestamp}</span>
                          <span className="sm:hidden">{item.timestamp.split(':').slice(0, 2).join(':')}</span>
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            item.status === "executed"
                              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : item.status === "failed"
                              ? "border border-destructive/30 bg-destructive/10 text-destructive"
                              : item.status === "rejected"
                              ? "border border-muted bg-muted text-muted-foreground"
                              : "border border-primary/30 bg-primary/10 text-primary"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>

                    {/* Agent Proposal Summary */}
                    <p className="text-[10px] sm:text-sm text-muted-foreground leading-relaxed">{item.summary}</p>

                    {/* Action & Parameters */}
                    {item.details && (
                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 rounded-lg border border-border/60 bg-muted/20 p-2 sm:p-2.5 text-[9px] sm:text-xs">
                        <div>
                          <span className="text-[8px] sm:text-[10px] uppercase font-semibold text-muted-foreground block">
                            Action
                          </span>
                          <p className="font-medium capitalize text-foreground text-[9px] sm:text-xs mt-0.5">
                            {item.action.replace("_", " ")}
                          </p>
                        </div>
                        {item.details.amount ? (
                          <div>
                            <span className="text-[8px] sm:text-[10px] uppercase font-semibold text-muted-foreground block">
                              Amount
                            </span>
                            <p className="font-medium text-foreground text-[9px] sm:text-xs mt-0.5">
                              {String(item.details.amount)} {String(item.details.asset ?? "XLM")}
                            </p>
                          </div>
                        ) : null}
                        {item.details.recipient ? (
                          <div className="col-span-2">
                            <span className="text-[8px] sm:text-[10px] uppercase font-semibold text-muted-foreground block">
                              Recipient
                            </span>
                            <p className="font-mono text-[8px] sm:text-[10px] font-medium text-foreground truncate mt-0.5">
                              {String(item.details.recipient)}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Execution Confirmation (if executed) */}
                    {item.status === "executed" && item.txHash && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 sm:p-2.5 text-[10px] sm:text-xs text-emerald-700 dark:text-emerald-300">
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 sm:h-4 w-3.5 sm:w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span>Confirmed on Stellar Testnet</span>
                        </div>
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${item.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium underline hover:text-foreground text-[9px] sm:text-xs whitespace-nowrap"
                        >
                          <span>Explorer</span>
                          <ExternalLink className="h-2.5 sm:h-3 w-2.5 sm:w-3" />
                        </a>
                      </div>
                    )}

                    {/* Error Display (if failed) */}
                    {item.status === "failed" && item.error && (
                      <div className="flex items-start gap-1.5 sm:gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2 sm:p-2.5 text-[10px] sm:text-xs text-destructive">
                        <AlertCircle className="h-3.5 sm:h-4 w-3.5 sm:w-4 shrink-0 mt-0.5" />
                        <span>{item.error}</span>
                      </div>
                    )}

                    {/* Action Controls for planned items */}
                    {item.status === "planned" && (
                      <div className="flex flex-col gap-2 pt-1">
                        <Button
                          type="button"
                          disabled={item.isExecuting}
                          onClick={() => handleApproveAndExecute(item)}
                          className="w-full gap-1.5 sm:gap-2 h-9 sm:h-10 text-xs sm:text-sm"
                        >
                          {item.isExecuting ? (
                            <>
                              <Loader2 className="h-3 sm:h-4 w-3 sm:w-4 animate-spin" />
                              <span className="hidden sm:inline">Executing on Stellar...</span>
                              <span className="sm:hidden">Executing...</span>
                            </>
                          ) : (
                            <>
                              <span className="hidden sm:inline">Approve & Execute Plan</span>
                              <span className="sm:hidden">Approve & Execute</span>
                              <ArrowRight className="h-3 sm:h-4 w-3 sm:w-4" />
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={item.isExecuting}
                          onClick={() => handleReject(item.id)}
                          className="w-full h-9 sm:h-10 text-xs sm:text-sm"
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prompt Submission Form */}
          <form
            onSubmit={handleSubmit}
            className="mt-3 sm:mt-4 flex flex-col gap-2"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                disabled={!isConnected || loading}
                placeholder={
                  isConnected
                    ? "Ask the agent (e.g., 'Send 1 XLM to GC3P...')"
                    : "Connect your wallet above to enable the agent…"
                }
                className="h-9 sm:h-11 w-full flex-1 min-w-0 rounded-md border border-border bg-input px-3 sm:px-4 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 shadow-sm"
              />
              <Button
                type="submit"
                disabled={!isConnected || loading || !prompt.trim()}
                className="h-9 sm:h-11 w-full sm:w-auto gap-1.5 text-xs sm:text-sm shrink-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 sm:h-4 w-3.5 sm:w-4 animate-spin" />
                    <span className="hidden sm:inline">Planning…</span>
                    <span className="sm:hidden">Plan</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                    <span>Send</span>
                  </>
                )}
              </Button>
            </div>
            {error ? <p className="text-xs sm:text-sm text-destructive">{error}</p> : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
