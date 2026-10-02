"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  nextRunDate,
  type CreateScheduleInput,
  type ScheduledPaymentRow,
  type ScheduleFrequency,
} from "@/lib/schedule-utils";

// Re-export for convenience so existing imports from this module keep working.
export type { CreateScheduleInput, ScheduledPaymentRow, ScheduleFrequency };

export async function createScheduledPayment(
  input: CreateScheduleInput,
): Promise<{ id?: string; created: boolean; error?: string }> {
  const supabase = createAdminClient();
  if (!supabase) return { created: false, error: "Admin client unavailable" };

  const { data, error } = await supabase
    .from("scheduled_payments")
    .insert({
      user_id: input.userId,
      wallet_address: input.walletAddress,
      wallet_network: input.walletNetwork,
      recipient: input.recipient,
      amount: input.amount,
      asset: input.asset ?? "XLM",
      memo: input.memo ?? null,
      frequency: input.frequency,
      next_run_at: input.startAt,
      end_at: input.endAt ?? null,
      occurrences: input.occurrences ?? null,
      prompt_text: input.promptText ?? null,
      status: "active",
    })
    .select("id")
    .maybeSingle();

  if (error) return { created: false, error: error.message };
  return { id: data?.id, created: true };
}

export async function fetchDueSchedules(): Promise<ScheduledPaymentRow[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("scheduled_payments")
    .select("*")
    .eq("status", "active")
    .lte("next_run_at", new Date().toISOString())
    .order("next_run_at", { ascending: true })
    .limit(50);

  if (error) {
    console.error("fetchDueSchedules error:", error.message);
    return [];
  }

  return (data ?? []) as ScheduledPaymentRow[];
}

export async function markScheduleExecuted(
  id: string,
  txHash: string,
  frequency: ScheduleFrequency,
  runsCompleted: number,
  occurrences: number | null,
  endAt: string | null,
): Promise<void> {
  const supabase = createAdminClient();
  if (!supabase) return;

  const now = new Date();
  const next = nextRunDate(now, frequency);
  const newRuns = runsCompleted + 1;
  const exhausted =
    frequency === "once" ||
    (occurrences !== null && newRuns >= occurrences) ||
    (endAt !== null && next > new Date(endAt));

  await supabase
    .from("scheduled_payments")
    .update({
      last_tx_hash: txHash,
      last_run_at: now.toISOString(),
      last_error: null,
      runs_completed: newRuns,
      next_run_at: next.toISOString(),
      status: exhausted ? "completed" : "active",
    })
    .eq("id", id);
}

export async function markScheduleFailed(id: string, errorMessage: string): Promise<void> {
  const supabase = createAdminClient();
  if (!supabase) return;

  await supabase
    .from("scheduled_payments")
    .update({ last_error: errorMessage, last_run_at: new Date().toISOString() })
    .eq("id", id);
}
