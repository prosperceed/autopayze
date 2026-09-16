import { Repeat } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";
import { buttonVariants } from "@/components/ui/button";

export default function PaymentsPage() {
  return (
    <PlaceholderPage
      icon={Repeat}
      title="Payments"
      description="One-off and recurring transfers sent from your wallet."
      emptyTitle="No payments yet"
      emptyDescription="Payments you send or schedule will show up here, with status and confirmation details."
      action={
        <button className={buttonVariants({ size: "sm" })}>
          New payment
        </button>
      }
    />
  );
}
