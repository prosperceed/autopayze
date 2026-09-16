import { Gift } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";
import { buttonVariants } from "@/components/ui/button";

export default function AirdropsPage() {
  return (
    <PlaceholderPage
      icon={Gift}
      title="Airdrops"
      description="Batch token distributions to a list of addresses."
      emptyTitle="No airdrops yet"
      emptyDescription="Upload a list of recipient addresses and amounts to send your first airdrop, with a record of who received what."
      action={
        <button className={buttonVariants({ size: "sm" })}>
          New airdrop
        </button>
      }
    />
  );
}
