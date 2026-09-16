import { Wallet, Repeat, Gift, Activity as ActivityIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth";

const summaryCards = [
  { icon: Wallet, label: "Wallet balance", hint: "Connect a wallet to see this" },
  { icon: Repeat, label: "Active schedules", hint: "No schedules yet" },
  { icon: Gift, label: "Airdrops sent", hint: "No airdrops yet" },
  { icon: ActivityIcon, label: "This month's transactions", hint: "No activity yet" },
];

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = user.email?.split("@")[0] ?? "there";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s where your wallet and payment activity will show up once connected.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-5">
              <item.icon className="h-4 w-4 text-muted-foreground" />
              <p className="mt-3 text-2xl font-semibold text-foreground">—</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={ActivityIcon}
              title="No activity yet"
              description="Connect a wallet and set up a payment to see transactions here."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connected wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Wallet}
              title="No wallet connected"
              description="Connect a wallet to start scheduling payments."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
