import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createScheduledPayment } from "@/lib/schedule-service";
import type { ScheduleFrequency } from "@/lib/schedule-service";

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
