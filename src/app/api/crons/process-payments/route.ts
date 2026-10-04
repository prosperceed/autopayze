import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
	buildPaymentTransaction,
	submitPaymentTransaction,
} from "@/lib/stellar/transaction";
import { Keypair, StrKey, TransactionBuilder } from "@stellar/stellar-sdk";
import { getNetworkConfig } from "@/lib/stellar/client";
import { decryptSecret } from "@/lib/wallet-secrets";
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
// Runs once at cold-start. A missing variable throws immediately so
// misconfiguration surfaces in deployment logs before any request is served.
// ---------------------------------------------------------------------------
(function validateEnv() {
	const required: string[] = [
		"CRON_SECRET",
		"NEXT_PUBLIC_SUPABASE_URL",
		"SUPABASE_SERVICE_ROLE_KEY",
		"WALLET_ENCRYPTION_KEY",
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
	/** Horizon result_codes surfaced when on-chain submission is rejected */
	resultCodes?: {
		transaction?: string;
		operations?: string[];
	};
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function requireEnv(key: string): string {
	const value = process.env[key];
	if (!value) throw new Error(`Missing required environment variable: ${key}`);
	return value;
}

/**
 * Atomically transitions all due 'active' rows to 'processing', claiming them
 * for this invocation and preventing double-execution across concurrent cron
 * calls.
 */
async function claimPendingSchedules(): Promise<{
	ok: boolean;
	data: ScheduledPaymentRow[];
	error?: {
		message: string;
		details: string | null;
		code: string | null;
		hint: string | null;
	};
}> {
	const supabase = createAdminClient();
	const now = new Date().toISOString();

	const { data, error } = await supabase
		.from("scheduled_payments")
		.update({ status: "processing" })
		.eq("status", "active")
		.lte("next_run_at", now)
		.select("*");

	if (error) {
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

/**
 * Fetches the encrypted_secret from wallet_secrets and decrypts it to a raw
 * Stellar 'S...' secret key.
 *
 * Returns null with a reason string if the secret is unavailable or cannot be
 * decrypted — the caller must treat this as a skippable (not failed) run so
 * the schedule is reverted to 'active' and retried next cycle.
 */
async function resolveSigningKey(
	walletAddress: string,
	userId: string,
): Promise<{ secret: string } | { secret: null; reason: string }> {
	try {
		const supabase = createAdminClient();

		const { data, error } = await supabase
			.from("wallet_secrets")
			.select("encrypted_secret")
			.eq("wallet_address", walletAddress)
			.eq("user_id", userId)
			.maybeSingle();

		if (error) {
			console.warn("[process-payments] resolveSigningKey DB error:", error.message);
			return { secret: null, reason: `DB error reading wallet secret: ${error.message}` };
		}

		if (!data?.encrypted_secret) {
			return {
				secret: null,
				reason: "No signing key stored. Wallet must be re-connected to enable autonomous execution.",
			};
		}

		// Decrypt the stored ciphertext back to the raw 'S...' secret key.
		let rawSecret: string;
		try {
			rawSecret = decryptSecret(data.encrypted_secret);
		} catch (decryptErr) {
			const msg = decryptErr instanceof Error ? decryptErr.message : String(decryptErr);
			console.error("[process-payments] resolveSigningKey decryption failed:", msg);
			return {
				secret: null,
				reason: `Signing key decryption failed: ${msg}. Re-submit the wallet secret to fix this.`,
			};
		}

		// Validate the decrypted value is a proper Stellar secret key before
		// passing it to Keypair.fromSecret(). An invalid key would throw a
		// confusing low-level error — better to surface it clearly here.
		if (!StrKey.isValidEd25519SecretSeed(rawSecret)) {
			console.error(
				"[process-payments] resolveSigningKey: decrypted value is not a valid Stellar secret key",
				`(wallet: ${walletAddress})`,
			);
			return {
				secret: null,
				reason:
					"Stored signing key is not a valid Stellar secret key after decryption. " +
					"Re-submit the wallet secret to fix this.",
			};
		}

		return { secret: rawSecret };
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		console.error("[process-payments] resolveSigningKey unexpected error:", msg);
		return { secret: null, reason: `Unexpected error resolving signing key: ${msg}` };
	}
}

async function revertToActive(id: string): Promise<void> {
	try {
		const supabase = createAdminClient();
		const { error } = await supabase
			.from("scheduled_payments")
			.update({ status: "active" })
			.eq("id", id);

		if (error) {
			console.warn(
				`[process-payments] revertToActive failed for schedule ${id}:`,
				error.message,
			);
		}
	} catch (err) {
		console.warn(
			`[process-payments] revertToActive exception for schedule ${id}:`,
			err instanceof Error ? err.message : String(err),
		);
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

// ---------------------------------------------------------------------------
// Core execution
// ---------------------------------------------------------------------------

async function executeSchedule(
	schedule: ScheduledPaymentRow,
): Promise<RunResult> {
	const network = schedule.wallet_network as StellarNetwork;

	// ------------------------------------------------------------------
	// 1. Resolve and decrypt the signing key.
	//    A missing/undecryptable key is a skippable failure — revert to
	//    'active' so the schedule is retried on the next cron cycle rather
	//    than permanently marked 'failed'.
	// ------------------------------------------------------------------
	const keyResult = await resolveSigningKey(
		schedule.wallet_address,
		schedule.user_id,
	);

	if (keyResult.secret === null) {
		console.warn(
			`[process-payments] skipping schedule ${schedule.id}: ${keyResult.reason}`,
		);

		// Revert to 'active' so we retry next cycle.
		await revertToActive(schedule.id);

		return {
			scheduleId: schedule.id,
			status: "skipped",
			error: keyResult.reason,
		};
	}

	const rawSecret = keyResult.secret;

	try {
		// ------------------------------------------------------------------
		// 2. Build the transaction (includes account existence + trustline
		//    pre-flights inside buildPaymentTransaction).
		// ------------------------------------------------------------------
		const draft = await buildPaymentTransaction({
			sourceAddress: schedule.wallet_address,
			destinationAddress: schedule.recipient,
			amount: schedule.amount,
			asset: schedule.asset as "XLM" | "USDC" | "USDT",
			network,
			memo: schedule.memo ?? null,
		});

		// ------------------------------------------------------------------
		// 3. Sign the transaction.
		//    Keypair.fromSecret() is safe here — StrKey.isValidEd25519SecretSeed()
		//    already validated rawSecret in resolveSigningKey().
		// ------------------------------------------------------------------
		const networkConfig = getNetworkConfig(network);
		const keypair = Keypair.fromSecret(rawSecret);
		const tx = TransactionBuilder.fromXDR(
			draft.xdr,
			networkConfig.networkPassphrase,
		);
		tx.sign(keypair);

		// ------------------------------------------------------------------
		// 4. Submit and evaluate the result.
		// ------------------------------------------------------------------
		const result = await submitPaymentTransaction(tx.toXDR(), network);

		if (!result.successful) {
			// Horizon rejected the transaction — mark as failed with full codes.
			const errorDetail =
				result.resultCodes
					? `Horizon rejected: ${JSON.stringify(result.resultCodes)}`
					: (result.error ?? "Submission failed");

			throw Object.assign(new Error(errorDetail), {
				resultCodes: result.resultCodes,
			});
		}

		// ------------------------------------------------------------------
		// 5. Advance schedule state on success.
		// ------------------------------------------------------------------
		await markCompleted(
			schedule.id,
			result.hash,
			schedule.frequency,
			schedule.runs_completed,
			schedule.occurrences,
			schedule.end_at,
		);

		console.log(
			`[process-payments] executed schedule ${schedule.id} → tx ${result.hash}`,
		);

		return {
			scheduleId: schedule.id,
			status: "executed",
			txHash: result.hash,
		};
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		const resultCodes =
			err &&
			typeof err === "object" &&
			"resultCodes" in err
				? (err as { resultCodes?: RunResult["resultCodes"] }).resultCodes
				: undefined;

		console.error(
			`[process-payments] schedule ${schedule.id} failed:`,
			msg,
			resultCodes ? { resultCodes } : "",
		);

		await markFailed(schedule.id, msg);

		return {
			scheduleId: schedule.id,
			status: "failed",
			error: msg,
			resultCodes,
		};
	}
}

// ---------------------------------------------------------------------------
// Main cron execution handler
// ---------------------------------------------------------------------------

async function handleCronExecution(): Promise<NextResponse> {
	const claimed = await claimPendingSchedules();

	if (!claimed.ok) {
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
// HTTP handlers — POST and GET both supported.
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
