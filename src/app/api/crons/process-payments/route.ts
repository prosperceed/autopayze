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
import type {
	ScheduledPaymentRow,
	ScheduleFrequency,
} from "@/lib/schedule-utils";
import type { StellarNetwork } from "@/lib/stellar/client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Module-level environment guardrails
// These run once at cold-start (module evaluation time in the Node.js runtime).
// A missing variable throws immediately so the misconfiguration surfaces in
// deployment logs rather than appearing as a cryptic 500 during the first
// invocation.
// ---------------------------------------------------------------------------
(function validateEnv() {
	const required: string[] = [
		"CRON_SECRET",
		"NEXT_PUBLIC_SUPABASE_URL",
		"SUPABASE_SERVICE_ROLE_KEY",
	];
	const missing = required.filter((key) => !process.env[key]);
	if (missing.length > 0) {
		throw new Error(
			`[process-payments] Missing required environment variable(s): ${missing.join(", ")}. ` +
				`Set them in .env.local or your deployment environment.`,
		);
	}
})();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type RunResult = {
	scheduleId: string;
	status: "executed" | "failed" | "skipped";
	txHash?: string;
	error?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Reads a required environment variable. Throws with a descriptive message if
 * the variable is absent — used inside request handlers where the module-level
 * guard has already run, but an explicit check keeps TypeScript happy and
 * prevents accidental undefined propagation.
 */
function requireEnv(key: string): string {
	const value = process.env[key];
	if (!value) throw new Error(`Missing required environment variable: ${key}`);
	return value;
}

/**
 * Atomically transitions all due 'active' rows to 'processing', claiming them
 * for this invocation and preventing double-execution across concurrent cron
 * calls.
 *
 * Returns a clean { ok, data, error } shape instead of throwing so the caller
 * can log the full Supabase error payload (message, details, code, hint)
 * before deciding how to surface the failure.
 */
async function claimPendingSchedules(): Promise<{
	ok: boolean;
	data: ScheduledPaymentRow[];
	error?: { message: string; details: string | null; code: string | null; hint: string | null };
}> {
	const supabase = createAdminClient(); // throws if env vars are missing
	const now = new Date().toISOString();

	const { data, error } = await supabase
		.from("scheduled_payments")
		.update({ status: "processing" })
		.eq("status", "active")
		.lte("next_run_at", now)
		.select("*");

	if (error) {
		// Log every field Supabase exposes so the root cause is visible in
		// server logs without requiring a database query post-mortem.
		console.error("[process-payments] claimPendingSchedules DB error:", {
			message: error.message,
			details: (error as { details?: string | null }).details ?? null,
			code: (error as { code?: string | null }).code ?? null,
			hint: (error as { hint?: string | null }).hint ?? null,
		});

		return {
			ok: false,
			data: [],
			error: {
				message: error.message,
				details: (error as { details?: string | null }).details ?? null,
				code: (error as { code?: string | null }).code ?? null,
				hint: (error as { hint?: string | null }).hint ?? null,
			},
		};
	}

	return { ok: true, data: (data ?? []) as ScheduledPaymentRow[] };
}

async function resolveSigningKey(
	walletAddress: string,
	userId: string,
): Promise<string | null> {
	try {
		const supabase = createAdminClient();

		const { data } = await supabase
			.from("wallet_secrets")
			.select("encrypted_secret")
			.eq("wallet_address", walletAddress)
			.eq("user_id", userId)
			.maybeSingle();

		return data?.encrypted_secret ?? null;
	} catch {
		return null;
	}
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

	await supabase
		.from("scheduled_payments")
		.update({
			status: "failed",
			last_error: errorMessage,
			last_run_at: new Date().toISOString(),
		})
		.eq("id", id);
}

async function executeSchedule(
	schedule: ScheduledPaymentRow,
): Promise<RunResult> {
	const network = schedule.wallet_network as StellarNetwork;

	try {
		const secret = await resolveSigningKey(
			schedule.wallet_address,
			schedule.user_id,
		);
		if (!secret) {
			// Revert to 'active' so this schedule is retried on the next cron run.
			await createAdminClient()
				.from("scheduled_payments")
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
		const tx = TransactionBuilder.fromXDR(
			draft.xdr,
			networkConfig.networkPassphrase,
		);
		tx.sign(keypair);

		const result = await submitPaymentTransaction(tx.toXDR(), network);
		if (!result.successful)
			throw new Error(result.error ?? "Submission failed");

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

// ---------------------------------------------------------------------------
// Main cron execution handler
// ---------------------------------------------------------------------------
async function handleCronExecution(): Promise<NextResponse> {
	// Claim pending schedules — returns { ok, data, error } instead of throwing
	// so we can emit structured logs before responding.
	const claimed = await claimPendingSchedules();

	if (!claimed.ok) {
		// claimPendingSchedules already logged the DB error fields above.
		return NextResponse.json(
			{
				ok: false,
				error: "Failed to claim pending schedules from the database.",
				details: claimed.error,
			},
			{ status: 500 },
		);
	}

	if (claimed.data.length === 0) {
		return NextResponse.json({ ok: true, ran: 0, results: [] });
	}

	const results: RunResult[] = [];
	for (const schedule of claimed.data) {
		results.push(await executeSchedule(schedule));
	}

	const executed = results.filter((r) => r.status === "executed").length;
	const failed = results.filter((r) => r.status === "failed").length;
	const skipped = results.filter((r) => r.status === "skipped").length;

	console.log(
		`[process-payments] ran=${claimed.data.length} executed=${executed} failed=${failed} skipped=${skipped}`,
	);

	return NextResponse.json({
		ok: true,
		ran: claimed.data.length,
		executed,
		failed,
		skipped,
		results,
	});
}

// ---------------------------------------------------------------------------
// HTTP handlers — both POST and GET are supported.
// Vercel Cron and cron-job.org typically use GET; POST is available for
// manual or webhook-style invocations.
// Both require: Authorization: Bearer <CRON_SECRET>
// ---------------------------------------------------------------------------

export async function POST(): Promise<NextResponse> {
	try {
		const headersList = await headers();
		const authHeader = headersList.get("authorization");
		const cronSecret = requireEnv("CRON_SECRET");

		if (authHeader !== `Bearer ${cronSecret}`) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		return await handleCronExecution();
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		console.error(`[process-payments] POST handler error: ${msg}`);
		return NextResponse.json({ ok: false, error: msg }, { status: 500 });
	}
}

export async function GET(): Promise<NextResponse> {
	try {
		const headersList = await headers();
		const authHeader = headersList.get("authorization");
		const cronSecret = requireEnv("CRON_SECRET");

		if (authHeader !== `Bearer ${cronSecret}`) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		return await handleCronExecution();
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		console.error(`[process-payments] GET handler error: ${msg}`);
		return NextResponse.json({ ok: false, error: msg }, { status: 500 });
	}
}
