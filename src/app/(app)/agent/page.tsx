"use client";

import { useState } from "react";
import { Bot, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useWallet } from "@/providers/wallet-provider";
import { useNotification } from "@/components/ui/notification";
import { buildPaymentTransaction } from "@/lib/stellar/transaction";

export default function AgentPage() {
  const { isConnected, connection } = useWallet();
  const { notify } = useNotification();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{
    summary: string;
    action: string;
    status: string;
    details?: Record<string, unknown>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);
  const { signTransaction } = useWallet();

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
        body: JSON.stringify({ prompt: trimmedPrompt }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "The agent could not process your request.");
      }

      setResponse({
        summary: data.summary,
        action: data.action,
        status: data.status,
        details: data.details ?? {},
      });
      setApproved(false);
      setPrompt("");
      notify({
        type: "success",
        title: "Agent action parsed",
        message: data.summary,
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "The agent could not process your request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          AI agent
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell the agent what you want to happen with your wallet. It plans the transactions and asks before anything irreversible.
        </p>
      </div>

      <Card className="flex flex-1 flex-col">
        <CardContent className="flex flex-1 flex-col pt-5">
          {!isConnected ? (
            <div className="flex flex-1 items-center">
              <EmptyState
                icon={Bot}
                title="Agent not connected yet"
                description="Connect and verify your wallet before the agent can process prompts."
              />
            </div>
          ) : (
            <div className="flex flex-1 flex-col gap-4">
              <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
                <Sparkles className="h-4 w-4" />
                Wallet confirmed: {connection?.address.slice(0, 6)}...{connection?.address.slice(-4)}
              </div>
              {response ? (
                <div className="space-y-4 rounded-lg border border-border bg-muted/40 p-4 text-sm text-foreground">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">Agent summary</p>
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                      {response.status}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{response.summary}</p>
                  <div className="flex items-center justify-between rounded-md border border-border bg-background/80 px-3 py-2">
                    <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Action</span>
                    <span className="font-medium capitalize text-foreground">{response.action.replace("_", " ")}</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      onClick={async () => {
                        try {
                          if (response?.details && response.action === "payment" && connection) {
                            const paymentDetails = response.details as {
                              recipient?: string;
                              amount?: string;
                              asset?: 'XLM' | 'USDC' | 'USDT';
                              network?: 'stellar-testnet' | 'stellar-mainnet';
                              memo?: string | null;
                            };

                            if (!paymentDetails.recipient || !paymentDetails.amount) {
                              throw new Error("This payment plan is missing the target or amount.");
                            }

                            const draft = await buildPaymentTransaction({
                              sourceAddress: connection.address,
                              destinationAddress: paymentDetails.recipient,
                              amount: paymentDetails.amount,
                              asset: paymentDetails.asset ?? 'XLM',
                              network: paymentDetails.network ?? (connection.network as 'stellar-testnet' | 'stellar-mainnet'),
                              memo: paymentDetails.memo ?? null,
                            });

                            const signedXdr = await signTransaction(draft.xdr);
                            if (!signedXdr) {
                              throw new Error("The wallet rejected the transaction signature.");
                            }

                            notify({
                              type: "success",
                              title: "Transaction signed",
                              message: "The approved payment was signed and is ready for the next execution step.",
                            });
                          }

                          setApproved(true);
                          notify({
                            type: "success",
                            title: "Plan approved",
                            message: "The AI proposal has been reviewed and marked as approved.",
                          });
                        } catch (approveError) {
                          notify({
                            type: "error",
                            title: "Approval failed",
                            message: approveError instanceof Error ? approveError.message : "The transaction could not be approved.",
                          });
                        }
                      }}
                      className="flex-1"
                    >
                      Approve plan
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setApproved(false);
                        setResponse(null);
                        notify({
                          type: "info",
                          title: "Plan rejected",
                          message: "The AI plan was discarded and can be revised.",
                        });
                      }}
                      className="flex-1"
                    >
                      Reject
                    </Button>
                  </div>

                  {approved ? (
                    <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
                      Review complete: this prompt has been approved for execution and can proceed to the next payment workflow.
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              disabled={!isConnected || loading}
              placeholder={isConnected ? "Ask the agent to set up a payment…" : "Connect your wallet to enable the agent…"}
              className="h-11 flex-1 rounded-md border border-border bg-input px-3 text-sm text-foreground placeholder:text-muted-foreground disabled:opacity-60"
            />
            <Button type="submit" disabled={!isConnected || loading} className="h-11">
              {loading ? "Sending…" : "Send"}
            </Button>
          </form>

          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
