"use client";

import { useState } from "react";
import { Chrome, Github } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);

  async function handleOAuth(provider: "google" | "github") {
    setError(null);
    setOauthLoading(provider);

    const supabase = createClient();
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      setOauthLoading(null);
      setError(error.message);
      return;
    }

    if (data.url) window.location.assign(data.url);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOAuth("google")}
          disabled={Boolean(oauthLoading)}
        >
          <Chrome aria-hidden="true" size={18} />
          {oauthLoading === "google" ? "Connecting Google…" : "Continue with Google"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOAuth("github")}
          disabled={Boolean(oauthLoading)}
        >
          <Github aria-hidden="true" size={18} />
          {oauthLoading === "github" ? "Connecting GitHub…" : "Continue with GitHub"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
