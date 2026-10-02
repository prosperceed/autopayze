/**
 * /api/wallet/session
 *
 * Tiny session store for the SEP-0007 mobile deep-link flow.
 *
 * POST { token }         — create/touch a pending session (browser calls before opening deep link)
 * POST { token, address } — complete a pending session (callback page calls after Freighter returns)
 * GET  ?token=...        — poll for a completed session (browser polls after opening deep link)
 * DELETE ?token=...      — cancel / clean up
 *
 * Sessions are kept in-process (Map) which is fine for a single-server dev/preview environment.
 * For multi-instance production swap the Map for a Redis key with 5-min TTL.
 */

import { NextResponse } from "next/server";

type SessionEntry = {
  address: string | null;   // null = still pending
  createdAt: number;
};

// Module-level store — survives across requests in the same worker process.
const sessions = new Map<string, SessionEntry>();
const TTL_MS = 5 * 60 * 1000; // 5 minutes

function purgeExpired() {
  const now = Date.now();
  for (const [token, entry] of sessions) {
    if (now - entry.createdAt > TTL_MS) sessions.delete(token);
  }
}

function isValidToken(token: unknown): token is string {
  return typeof token === "string" && /^[a-zA-Z0-9_-]{16,64}$/.test(token);
}

// POST — create pending OR complete with address
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, address } = body ?? {};

    if (!isValidToken(token)) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    purgeExpired();

    if (address) {
      // Completing a session — callback page writes the resolved address
      if (typeof address !== "string" || !/^G[A-Z2-7]{55}$/.test(address)) {
        return NextResponse.json({ error: "Invalid Stellar address" }, { status: 400 });
      }
      const existing = sessions.get(token);
      if (!existing) {
        return NextResponse.json({ error: "Session not found or expired" }, { status: 404 });
      }
      sessions.set(token, { address, createdAt: existing.createdAt });
      return NextResponse.json({ ok: true });
    }

    // Creating / touching a pending session
    sessions.set(token, { address: null, createdAt: Date.now() });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

// GET — poll for a resolved address
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!isValidToken(token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  purgeExpired();
  const entry = sessions.get(token);

  if (!entry) {
    return NextResponse.json({ status: "expired" });
  }
  if (!entry.address) {
    return NextResponse.json({ status: "pending" });
  }

  // Consume session once resolved so it can't be replayed
  sessions.delete(token);
  return NextResponse.json({ status: "resolved", address: entry.address });
}

// DELETE — cancel
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (isValidToken(token)) sessions.delete(token);
  return NextResponse.json({ ok: true });
}
