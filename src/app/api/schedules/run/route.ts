import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  fetchDueSchedules,
  markScheduleExecuted,
  markScheduleFailed,
} from "@/lib/schedule-service";
import {
  buildPaymentTransaction,
  submitPaymentTransaction,
} from "@/lib/stellar/transaction";
import { createAdminClient } from "@/lib/supabase/admin";
import { Keypair, TransactionBuilder } from "@stellar/stellar-sdk";
import { getNetworkConfig } from "@/lib/stellar/client";
import type { StellarNetwork } from "@/lib/stellar/client";

type RunResult = {
  scheduleId: string;
  status: "executed" | "failed" | "skipped";
  txHash?: string;
  error?: string;
};

async function resolveSecretKey(walletAddress: string, userId: string): Promise<string | null> {
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

async function executeSchedule(schedule: Awaited<ReturnType<typeof fetchDueSchedules>>[number]): Promise<RunResult> {
  const network = schedule.wallet_network as StellarNetwork;

  try {
    const draft = await buildPaymentTransaction({
      sourceAddress: schedule.wallet_address,
      destinationAddress: schedule.recipient,
      amount: schedule.amount,
      asset: schedule.asset as "XLM" | "USDC" | "USDT",
      network,
      memo: schedule.memo ?? null,
    });

    const secret = await resolveSecretKey(schedule.wallet_address, schedule.user_id);
    if (!secret) {
      return {
        scheduleId: schedule.id,
        status: "skipped",
        error: "No signing key available for automated execution. Wallet must be re-connected.",
      };
    }

    const networkConfig = getNetworkConfig(network);
    const keypair = Keypair.fromSecret(secret);
    const tx = TransactionBuilder.fromXDR(draft.xdr, networkConfig.networkPassphrase);
    tx.sign(keypair);
    const signedXdr = tx.toXDR();

    const result = await submitPaymentTransaction(signedXdr, network);
    if (!result.successful) throw new Error(result.error ?? "Submission failed");

    await markScheduleExecuted(
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
    await markScheduleFailed(schedule.id, msg);
    return { scheduleId: schedule.id, status: "failed", error: msg };
  }
}

export async function GET() {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await fetchDueSchedules();

  if (due.length === 0) {
    return NextResponse.json({ ok: true, ran: 0, results: [] });
  }

  const results: RunResult[] = [];

  for (const schedule of due) {
    const result = await executeSchedule(schedule);
    results.push(result);
  }

  const executed = results.filter((r) => r.status === "executed").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const skipped = results.filter((r) => r.status === "skipped").length;

  console.log(`[schedule-runner] ran=${due.length} executed=${executed} failed=${failed} skipped=${skipped}`);

  return NextResponse.json({ ok: true, ran: due.length, executed, failed, skipped, results });
}
