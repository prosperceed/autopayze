"use client";

import { useEffect, useState } from "react";
import { Wallet, Repeat, Gift, Activity as ActivityIcon, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { WalletConnectionCard } from "@/components/wallet/wallet-connection-card";
import { useWallet } from "@/providers/wallet-provider";
import { useWalletBalance } from "@/lib/use-wallet-balance";
import { createClient } from "@/lib/supabase/client";

type ActivityStats = {
  activeSchedules: number;
  airdropsSent: number;
  monthlyTxCount: number;
};

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  loading?: boolean;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 sm:pt-5">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <p className={`mt-2 sm:mt-3 text-lg sm:text-2xl font-semibold text-foreground tabular-nums transition-all ${loading ? "opacity-40" : ""}`}>
          {value}
        </p>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{label}</p>
        {sub && <p className="mt-0.5 text-[10px] text-muted-foreground/60">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { connection, isConnected } = useWallet();
  const { xlmBalance, loading: balanceLoading, lastUpdated, refresh } = useWalletBalance(
    connection?.address ?? null,
    connection?.network ?? null,
  );

  const [stats, setStats] = useState<ActivityStats>({ activeSchedules: 0, airdropsSent: 0, monthlyTxCount: 0 });
  const [statsLoading, setStatsLoading] = useState(false);
  const [firstName, setFirstName] = useState("there");

  // Fetch user email for greeting
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setFirstName(data.user.email.split("@")[0]);
    });
  }, []);

  // Fetch dashboard stats; re-run when wallet connects
  useEffect(() => {
    if (!isConnected) {
      setStats({ activeSchedules: 0, airdropsSent: 0, monthlyTxCount: 0 });
      return;
    }

    const supabase = createClient();

    const load = async () => {
      setStatsLoading(true);
      try {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const [schedulesRes, airdropsRes, monthlyRes] = await Promise.all([
          supabase
            .from("agent_transactions")
            .select("id", { count: "exact", head: true })
            .eq("wallet_address", connection!.address)
            .eq("action_type", "schedule_payment")
            .in("status", ["accepted", "executed"]),
          supabase
            .from("agent_transactions")
            .select("id", { count: "exact", head: true })
            .eq("wallet_address", connection!.address)
            .eq("action_type", "airdrop"),
          supabase
            .from("agent_transactions")
            .select("id", { count: "exact", head: true })
            .eq("wallet_address", connection!.address)
            .gte("created_at", monthStart.toISOString()),
        ]);

        setStats({
          activeSchedules: schedulesRes.count ?? 0,
          airdropsSent: airdropsRes.count ?? 0,
          monthlyTxCount: monthlyRes.count ?? 0,
        });
      } finally {
        setStatsLoading(false);
      }
    };

    load();

    // Realtime: refresh stats when any transaction changes
    const channel = supabase
      .channel("dashboard-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "agent_transactions" }, load)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isConnected, connection]);

  const balanceDisplay = balanceLoading && xlmBalance === null
    ? "—"
    : xlmBalance !== null
    ? `${xlmBalance} XLM`
    : isConnected ? "—" : "—";

  const balanceSub = lastUpdated
    ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : isConnected && !balanceLoading ? undefined : undefined;

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            {isConnected
              ? "Your wallet is connected. Balances and activity update live."
              : "Connect your wallet to see live balance and activity."}
          </p>
        </div>
        {isConnected && (
          <button
            type="button"
            onClick={refresh}
            disabled={balanceLoading}
            aria-label="Refresh balance"
            className="mt-1 rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`h-4 w-4 ${balanceLoading ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Wallet balance"
          value={balanceDisplay}
          loading={balanceLoading}
          sub={balanceSub}
        />
        <StatCard
          icon={Repeat}
          label="Active schedules"
          value={statsLoading ? "—" : String(stats.activeSchedules)}
          loading={statsLoading}
        />
        <StatCard
          icon={Gift}
          label="Airdrops sent"
          value={statsLoading ? "—" : String(stats.airdropsSent)}
          loading={statsLoading}
        />
        <StatCard
          icon={ActivityIcon}
          label="This month"
          value={statsLoading ? "—" : `${stats.monthlyTxCount} tx`}
          loading={statsLoading}
        />
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="p-3 sm:p-5">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              Recent activity
              <span className="inline-flex h-2 w-2 rounded-full bg-success animate-pulse" aria-hidden="true" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-5 pt-0">
            <RecentTransactions walletAddress={connection?.address ?? null} />
          </CardContent>
        </Card>

        <WalletConnectionCard />
      </div>
    </div>
  );
}
