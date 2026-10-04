/**
 * DEPRECATED — this route is superseded by /api/crons/process-payments.
 *
 * /api/crons/process-payments is the canonical scheduled-payment runner:
 *   - Accepts POST with Authorization: Bearer <CRON_SECRET>
 *   - Atomically claims rows by transitioning status active → processing
 *     to prevent double-execution on concurrent cron invocations
 *   - Correctly marks failed rows as status: 'failed'
 *
 * Point your cron service (cron-job.org, Vercel Cron, etc.) at:
 *   POST /api/crons/process-payments
 *   Authorization: Bearer <CRON_SECRET>
 *
 * This route now returns 308 Permanent Redirect so any stale references
 * automatically follow through to the correct endpoint.
 */

import { NextResponse } from "next/server";

const TARGET = "/api/crons/process-payments";

export async function GET() {
  return NextResponse.redirect(new URL(TARGET, "http://localhost"), { status: 308 });
}

export async function POST() {
  return NextResponse.redirect(new URL(TARGET, "http://localhost"), { status: 308 });
}
