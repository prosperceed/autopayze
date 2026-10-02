import { cn } from "@/lib/utils";

type Status =
  | "active"
  | "paused"
  | "completed"
  | "failed"
  | "accepted"
  | "executed"
  | "rejected"
  | "review_required"
  | "planned"
  | string;

const STATUS_STYLES: Record<string, string> = {
  active:          "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  executed:        "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  accepted:        "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400",
  completed:       "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  paused:          "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  review_required: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  planned:         "border-primary/30 bg-primary/10 text-primary",
  failed:          "border-destructive/30 bg-destructive/10 text-destructive",
  rejected:        "border-border bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  review_required: "Review",
  schedule_payment: "Schedule",
};

export function StatusBadge({
  status,
  className,
}: {
  status: Status;
  className?: string;
}) {
  const style = STATUS_STYLES[status] ?? "border-border bg-muted text-muted-foreground";
  const label = STATUS_LABELS[status] ?? status.replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        style,
        className,
      )}
    >
      {label}
    </span>
  );
}
