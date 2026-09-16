import { Repeat } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";
import { buttonVariants } from "@/components/ui/button";

export default function SchedulesPage() {
  return (
    <PlaceholderPage
      icon={Repeat}
      title="Schedules"
      description="Recurring rules that run without you starting them each time."
      emptyTitle="No schedules yet"
      emptyDescription="Set a rule once — a weekly transfer, monthly payroll — and Autopayze will run it on time."
      action={
        <button className={buttonVariants({ size: "sm" })}>
          New schedule
        </button>
      }
    />
  );
}
