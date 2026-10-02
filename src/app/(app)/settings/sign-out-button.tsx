"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useNotification } from "@/components/ui/notification";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const { notify } = useNotification();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    notify({
      type: "info",
      title: "You're signed out",
      message: "Your session has been securely ended.",
    });
    router.push("/");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleSignOut}
      disabled={loading}
      className="shrink-0 gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
    >
      <LogOut className="h-3.5 w-3.5" />
      {loading ? "Signing out…" : "Sign out"}
    </Button>
  );
}
