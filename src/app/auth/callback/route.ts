import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedPath = searchParams.get("next");
  const next =
    requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
      ? requestedPath
      : "/dashboard";

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=auth-callback-failed", origin),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("OAuth callback error:", error.message);
    return NextResponse.redirect(
      new URL("/login?error=auth-callback-failed", origin),
    );
  }

  const destination = new URL(next, origin);
  destination.searchParams.set("notice", "logged-in");
  return NextResponse.redirect(destination);
}
