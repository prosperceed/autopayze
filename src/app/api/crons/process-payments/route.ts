import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildPaymentTransaction,
  submitPaymentTransaction,
} from "@/lib/stellar/transaction";
import { Keypair, TransactionBuilder } from "@stellar/stellar-sdk";
import { getNetworkConfig } from "@/lib/stellar/client";
import { nextRunDate } from "@/lib/schedule-utils";
import type { ScheduledPaymentRow, ScheduleFrequency } from "@/lib/schedule-utils";
import type { StellarNetwork } from "@/lib/stellar/client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RunResult = {
  scheduleId: string;
  status: "executed" | "failed" | "skipped";
  txHash?: string;
  error?: string;
};

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

async function claimPendingSchedules(): Promise<ScheduledPaymentRow[]> {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  const now = new Date().toISOString();

  // Atomically transition due active rows to 'processing' to prevent double-execution
  // across concurrent cron invocations.
  const { data, error } = await supabase
    .from("scheduled_payments")
    .update({ status: "processing" })
    .eq("status", "active")
    .lte("next_run_at", now)
    .select("*");

  if (error) throw new Error(`Failed to claim schedules: ${error.message}`);
  return (data ?? []) as ScheduledPaymentRow[];
}

async function resolveSigningKey(walletAddress: string, userId: string): Promise<string | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("wallet_secrets")
    .select("encrypted_secret")
    .eq("wallet_address", walletAddress)
    .eq("user_id", userId)
    .maybeSingle();

  return data?.encrypted_secret ?? null;
}

async function markCompleted(
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
      status: exhausted ? "completed" : "active",
      last_tx_hash: txHash,
      last_run_at: now.toISOString(),
      last_error: null,
      runs_completed: newRuns,
      next_run_at: next.toISOString(),
    })
    .eq("id", id);
}

async function markFailed(id: string, errorMessage: string): Promise<void> {
  const supabase = createAdminClient();
  if (!supabase) return;

  await supabase
    .from("scheduled_payments")
    .update({
      status: "failed",
      last_error: errorMessage,
      last_run_at: new Date().toISOString(),
    })
    .eq("id", id);
}

async function executeSchedule(schedule: ScheduledPaymentRow): Promise<RunResult> {
  const network = schedule.wallet_network as StellarNetwork;

  try {
    const secret = await resolveSigningKey(schedule.wallet_address, schedule.user_id);
    if (!secret) {
      // Return skipped — revert to active so it will be retried next run.
      await createAdminClient()
        ?.from("scheduled_payments")
        .update({ status: "active" })
        .eq("id", schedule.id);

      return {
        scheduleId: schedule.id,
        status: "skipped",
        error: "No signing key available. Wallet must be re-connected.",
      };
    }

    const draft = await buildPaymentTransaction({
      sourceAddress: schedule.wallet_address,
      destinationAddress: schedule.recipient,
      amount: schedule.amount,
      asset: schedule.asset as "XLM" | "USDC" | "USDT",
      network,
      memo: schedule.memo ?? null,
    });

    const networkConfig = getNetworkConfig(network);
    const keypair = Keypair.fromSecret(secret);
    const tx = TransactionBuilder.fromXDR(draft.xdr, networkConfig.networkPassphrase);
    tx.sign(keypair);

    const result = await submitPaymentTransaction(tx.toXDR(), network);
    if (!result.successful) throw new Error(result.error ?? "Submission failed");

    await markCompleted(
      schedule.id,
      result.hash,
      schedule.frequency,
      schedule.runs_completed,
      schedule.occurrences,
      schedule.end_at,
    );

    return { scheduleId: schedule.id, status: "executed", txHash: result.hash };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markFailed(schedule.id, msg);
    return { scheduleId: schedule.id, status: "failed", error: msg };
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  const cronSecret = requireEnv("CRON_SECRET");

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let claimed: ScheduledPaymentRow[];
  try {
    claimed = await claimPendingSchedules();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[process-payments] claim error: ${msg}`);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  if (claimed.length === 0) {
    return NextResponse.json({ ok: true, ran: 0, results: [] });
  }

  const results: RunResult[] = [];
  for (const schedule of claimed) {
    results.push(await executeSchedule(schedule));
  }

  const executed = results.filter((r) => r.status === "executed").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const skipped = results.filter((r) => r.status === "skipped").length;

  console.log(
    `[process-payments] ran=${claimed.length} executed=${executed} failed=${failed} skipped=${skipped}`,
  );

  return NextResponse.json({ ok: true, ran: claimed.length, executed, failed, skipped, results });
}
