import { Wallet } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";
import { buttonVariants } from "@/components/ui/button";

export default function WalletPage() {
  return (
    <PlaceholderPage
      icon={Wallet}
      title="Wallet"
      description="Balances and connected addresses across chains."
      emptyTitle="No wallet connected"
      emptyDescription="Connect a wallet to see balances here. Autopayze can only send a payment once a wallet is linked and a rule allows it."
      action={
        <button className={buttonVariants({ size: "sm" })}>
          Connect wallet
        </button>
      }
    />
  );
}
