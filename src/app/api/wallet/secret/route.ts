import { NextResponse } from "next/server";
import { upsertWalletSecret } from "@/lib/wallet-secrets";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { walletAddress, secretKey } = body ?? {};

    if (!walletAddress || !secretKey) {
      return NextResponse.json(
        { error: "walletAddress and secretKey are required" },
        { status: 400 },
      );
    }

    const result = await upsertWalletSecret(walletAddress, secretKey);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to store wallet secret" },
      { status: 500 },
    );
  }
}
