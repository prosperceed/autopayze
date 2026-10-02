"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Repeat,
  Calendar,
  Pause,
  Play,
  Trash2,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Loader2,
  Bot,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { useNotification } from "@/components/ui/notification";
import Link from "next/link";
import type { ScheduledPaymentRow } from "@/lib/schedule-utils";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNextRun(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 0) return "Overdue";
  if (diffMin < 60) return `in ${diffMin}m`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `in ${diffH}h`;
  const diffD = Math.round(diffH / 24);
  return `in ${diffD}d`;
}

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const FREQ_LABELS: Record<string, string> = {
  once: "One-time",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export default function SchedulesPage() {
  const { notify } = useNotification();
  const [schedules, setSchedules] = useState<ScheduledPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/schedules");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to load schedules");
      setSchedules(json.schedules ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load schedules.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePauseResume(schedule: ScheduledPaymentRow) {
    const newStatus = schedule.status === "active" ? "paused" : "active";
    setActionId(schedule.id);
    try {
      const res = await fetch(`/api/schedules/${schedule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json?.error ?? "Action failed.");
      }
      setSchedules((prev) =>
        prev.map((s) => (s.id === schedule.id ? { ...s, status: newStatus as ScheduledPaymentRow["status"] } : s)),
      );
      notify({
        type: "success",
        title: newStatus === "paused" ? "Schedule paused" : "Schedule resumed",
        message: `Payment schedule is now ${newStatus}.`,
      });
    } catch (err) {
      notify({
        type: "error",
        title: "Action failed",
        message: err instanceof Error ? err.message : "Could not update schedule.",
      });
    } finally {
      setActionId(null);
    }
  }

  async function handleCancel(schedule: ScheduledPaymentRow) {
    if (!confirm("Cancel this schedule? This cannot be undone.")) return;
    setActionId(schedule.id);
    try {
      const res = await fetch(`/api/schedules/${schedule.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json?.error ?? "Delete failed.");
      }
      setSchedules((prev) => prev.filter((s) => s.id !== schedule.id));
      notify({ type: "info", title: "Schedule cancelled", message: "The scheduled payment has been removed." });
    } catch (err) {
      notify({
        type: "error",
        title: "Cancel failed",
        message: err instanceof Error ? err.message : "Could not cancel schedule.",
      });
    } finally {
      setActionId(null);
    }
  }

  const activeCount = schedules.filter((s) => s.status === "active").length;

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Schedules
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Recurring payment rules that run automatically.
            {!loading && schedules.length > 0 && (
              <> {activeCount} active.</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
            aria-label="Refresh schedules"
            className="gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Link href="/agent" className={buttonVariants({ size: "sm" }) + " gap-1.5"}>
            <Bot className="h-3.5 w-3.5" />
            New schedule
          </Link>
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardHeader className="p-3 sm:p-5">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Repeat className="h-4 w-4 text-muted-foreground" />
            Scheduled payments
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-5 pt-0">
          {loading && <LoadingRows rows={4} />}

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

          {!loading && !error && schedules.length === 0 && (
            <EmptyState
              icon={Calendar}
              title="No schedules yet"
              description="Tell the AI agent to schedule a recurring payment and it will appear here."
              action={
                <Link href="/agent" className={buttonVariants({ size: "sm" }) + " mt-2 gap-1.5"}>
                  <Bot className="h-3.5 w-3.5" />
                  Open agent
                </Link>
              }
            />
          )}

          {!loading && !error && schedules.length > 0 && (
            <div className="space-y-2">
              {/* Table header — desktop only */}
              <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto_auto] gap-3 pb-2 border-b border-border/40 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Payment</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Frequency</span>
                <span className="text-right">Next run</span>
                <span className="text-right">Actions</span>
              </div>

              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex flex-col sm:grid sm:grid-cols-[1fr_auto_auto_auto_auto] gap-2 sm:gap-3 rounded-lg border border-border/50 bg-muted/20 p-3 hover:bg-muted/30 transition-colors"
                >
                  {/* Main info */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={schedule.status} />
                      <span className="font-mono text-[10px] text-muted-foreground">
                        → {short(schedule.recipient)}
                      </span>
                      {schedule.memo && (
                        <span className="text-[10px] text-muted-foreground italic truncate max-w-[120px]">
                          &ldquo;{schedule.memo}&rdquo;
                        </span>
                      )}
                    </div>
                    {schedule.prompt_text && (
                      <p className="mt-1 text-[10px] text-muted-foreground/70 line-clamp-1">
                        {schedule.prompt_text}
                      </p>
                    )}
                    <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                      Created {formatDate(schedule.created_at)}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <span className="text-xs sm:hidden font-medium text-muted-foreground">Amount</span>
                    <span className="font-semibold tabular-nums text-sm text-foreground">
                      {schedule.amount} {schedule.asset}
                    </span>
                  </div>

                  {/* Frequency */}
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <span className="text-xs sm:hidden font-medium text-muted-foreground">Frequency</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {FREQ_LABELS[schedule.frequency] ?? schedule.frequency}
                    </span>
                  </div>

                  {/* Next run */}
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <span className="text-xs sm:hidden font-medium text-muted-foreground">Next run</span>
                    <div className="text-right">
                      {schedule.status === "active" ? (
                        <>
                          <p className="text-xs font-medium text-foreground whitespace-nowrap">
                            {formatNextRun(schedule.next_run_at)}
                          </p>
                          <p className="text-[10px] text-muted-foreground/70 whitespace-nowrap">
                            {new Date(schedule.next_run_at).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1.5">
                    {schedule.last_tx_hash && (
                      <a
                        href={`https://stellar.expert/explorer/${schedule.wallet_network === "stellar-mainnet" ? "public" : "testnet"}/tx/${schedule.last_tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="View last transaction on Stellar Expert"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}

                    {(schedule.status === "active" || schedule.status === "paused") && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          aria-label={schedule.status === "active" ? "Pause schedule" : "Resume schedule"}
                          disabled={actionId === schedule.id}
                          onClick={() => handlePauseResume(schedule)}
                        >
                          {actionId === schedule.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : schedule.status === "active" ? (
                            <Pause className="h-3.5 w-3.5" />
                          ) : (
                            <Play className="h-3.5 w-3.5" />
                          )}
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          aria-label="Cancel schedule"
                          disabled={actionId === schedule.id}
                          onClick={() => handleCancel(schedule)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}

                    {(schedule.status === "completed" || schedule.status === "failed") && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                    )}
                  </div>

                  {/* Last error */}
                  {schedule.last_error && (
                    <div className="col-span-full rounded-md bg-destructive/10 border border-destructive/20 px-2.5 py-1.5 text-[10px] text-destructive">
                      Last error: {schedule.last_error}
                    </div>
                  )}

                  {/* Runs completed */}
                  {(schedule.runs_completed ?? 0) > 0 && (
                    <div className="col-span-full text-[10px] text-muted-foreground/60">
                      {schedule.runs_completed} run{schedule.runs_completed !== 1 ? "s" : ""} completed
                      {schedule.occurrences ? ` / ${schedule.occurrences}` : ""}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
