import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  User,
  Palette,
  ShieldCheck,
  AlertTriangle,
  Key,
  Globe,
} from "lucide-react";
import { SignOutButton } from "./sign-out-button";

export default async function SettingsPage() {
  const user = await requireUser();

  const supabase = await createClient();

  // Fetch wallet count for display
  const { count: walletCount } = await supabase
    .from("wallets")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Fetch schedule count
  const { count: scheduleCount } = await supabase
    .from("scheduled_payments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "active");

  // Fetch total transactions
  const { count: txCount } = await supabase
    .from("agent_transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  return (
    <div className="max-w-2xl space-y-6 px-3 sm:px-0">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Manage your account, appearance, and security.
        </p>
      </div>

      {/* Account */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <User className="h-4 w-4 text-muted-foreground" />
            Account
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Your identity and usage on Autopayze.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground text-xs sm:text-sm">Email</span>
            <span className="font-medium text-foreground text-xs sm:text-sm">{user.email ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground text-xs sm:text-sm">Role</span>
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {user.role}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground text-xs sm:text-sm">User ID</span>
            <span className="font-mono text-[10px] sm:text-xs text-muted-foreground break-all text-right max-w-[200px]">
              {user.id}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Usage summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Globe className="h-4 w-4 text-muted-foreground" />
            Usage
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Your Autopayze activity summary.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
              <p className="text-xl font-bold tabular-nums text-foreground">{walletCount ?? 0}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Wallets</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
              <p className="text-xl font-bold tabular-nums text-foreground">{scheduleCount ?? 0}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Active schedules</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
              <p className="text-xl font-bold tabular-nums text-foreground">{txCount ?? 0}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Total actions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Palette className="h-4 w-4 text-muted-foreground" />
            Appearance
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Choose light, dark, or match your system setting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSwitcher />
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            Security
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            How Autopayze keeps your funds safe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3 text-xs sm:text-sm text-muted-foreground">
            <Key className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
            <p>
              Private keys are never stored on Autopayze servers. All transaction signing happens in your wallet.
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs sm:text-sm text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              The AI agent only plans transactions. No payment executes without your explicit approval.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Danger zone
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Irreversible account actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-border p-3">
            <div>
              <p className="text-xs sm:text-sm font-medium text-foreground">Sign out</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                End your current session on this device.
              </p>
            </div>
            <SignOutButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
