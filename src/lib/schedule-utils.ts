// Pure utility types and functions for scheduled payments.
// No "use server" — safe to import from both client and server contexts.

export type ScheduleFrequency = "once" | "daily" | "weekly" | "monthly";

export type CreateScheduleInput = {
  userId: string;
  walletAddress: string;
  walletNetwork: string;
  recipient: string;
  amount: string;
  asset?: string;
  memo?: string | null;
  frequency: ScheduleFrequency;
  startAt: string;
  endAt?: string | null;
  occurrences?: number | null;
  promptText?: string;
};

export type ScheduledPaymentRow = {
  id: string;
  user_id: string;
  wallet_address: string;
  wallet_network: string;
  recipient: string;
  amount: string;
  asset: string;
  memo: string | null;
  frequency: ScheduleFrequency;
  next_run_at: string;
  end_at: string | null;
  occurrences: number | null;
  runs_completed: number;
  status: "active" | "paused" | "completed" | "failed";
  last_tx_hash: string | null;
  last_run_at: string | null;
  last_error: string | null;
  prompt_text: string | null;
  created_at: string;
};

/**
 * Returns the next execution date for a schedule given a starting date and frequency.
 * For "once" schedules the date is returned unchanged.
 */
export function nextRunDate(from: Date, frequency: ScheduleFrequency): Date {
  const d = new Date(from);
  switch (frequency) {
    case "daily":   d.setDate(d.getDate() + 1); break;
    case "weekly":  d.setDate(d.getDate() + 7); break;
    case "monthly": d.setMonth(d.getMonth() + 1); break;
    case "once":    break;
  }
  return d;
}
