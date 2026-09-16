import { ShieldCheck, TriangleAlert, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletConnectButton } from "@/components/wallet/wallet-connect-button";

export default function WalletPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Wallet
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect and verify your Stellar Testnet wallet before making payments.
          </p>
        </div>
        <WalletConnectButton />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Wallet status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Network</span>
              <span className="font-medium text-foreground">Stellar Testnet</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Connection</span>
              <span className="font-medium text-foreground">Disconnected</span>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 p-3 text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-success" />
              No private keys are stored by the app.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TriangleAlert className="h-4 w-4 text-warning" /> Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Wallet verification is intentionally limited to public address and network validation in this phase.</p>
            <p>Wrong-network wallets are flagged before any workflow proceeds.</p>
            <p>Account existence checks are prepared via dedicated Stellar service boundaries.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
