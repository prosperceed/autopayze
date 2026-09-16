import {
  Users,
  Wallet,
  Repeat,
  Gift,
  Bot,
  Activity as ActivityIcon,
  CircleDot,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

const stats = [
  { icon: Users, label: "Total users" },
  { icon: Wallet, label: "Connected wallets" },
  { icon: Repeat, label: "Payments this month" },
  { icon: Gift, label: "Airdrops sent" },
];

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Platform overview
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A live view of Autopayze once it&apos;s connected to production data.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-5">
              <stat.icon className="h-4 w-4 text-muted-foreground" />
              <p className="mt-3 text-2xl font-semibold text-foreground">—</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent system activity</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={ActivityIcon}
              title="No activity yet"
              description="User payments, schedules and airdrops will appear here as they happen across the platform."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Supabase", status: "Not connected" },
              { label: "Payment execution", status: "Not connected" },
              { label: "AI agent", status: "Not connected" },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-foreground">{row.label}</span>
                <Badge tone="warning">
                  <CircleDot className="h-3 w-3" />
                  {row.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>AI agent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Bot}
              title="No agent runs yet"
              description="Actions the agent takes on behalf of users will be logged here."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Wallets</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Wallet}
              title="No wallets connected"
              description="Wallets users connect will be listed here."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Users}
              title="No users yet"
              description="New sign-ups will appear here."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
