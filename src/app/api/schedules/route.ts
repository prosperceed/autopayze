import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createScheduledPayment } from "@/lib/schedule-service";
import type { ScheduleFrequency } from "@/lib/schedule-service";

export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("scheduled_payments")
      .select(
        "id, created_at, recipient, amount, asset, memo, frequency, next_run_at, end_at, occurrences, runs_completed, status, last_tx_hash, last_run_at, last_error, prompt_text, wallet_address, wallet_network",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ schedules: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch schedules" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      walletAddress,
      walletNetwork,
      recipient,
      amount,
      asset,
      memo,
      frequency,
      startAt,
      endAt,
      occurrences,
      promptText,
    } = body ?? {};

    if (!walletAddress || !recipient || !amount || !frequency || !startAt) {
      return NextResponse.json(
        { error: "Missing required fields: walletAddress, recipient, amount, frequency, startAt" },
        { status: 400 },
      );
    }

    const result = await createScheduledPayment({
      userId: user.id,
      walletAddress,
      walletNetwork: walletNetwork ?? "stellar-testnet",
      recipient,
      amount,
      asset: asset ?? "XLM",
      memo: memo ?? null,
      frequency: frequency as ScheduleFrequency,
      startAt,
      endAt: endAt ?? null,
      occurrences: occurrences ?? null,
      promptText,
    });

    if (!result.created) {
      return NextResponse.json({ error: result.error ?? "Failed to create schedule" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, scheduleId: result.id });
  } catch (error) {
    console.error("Schedule create error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create schedule" },
      { status: 500 },
    );
  }
}
