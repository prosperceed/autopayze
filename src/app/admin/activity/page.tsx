"use client";

import { Activity } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/data-table";

type ActivityRow = {
  id: string;
  event: string;
  user: string;
  date: string;
};

const columns: Column<ActivityRow>[] = [
  { key: "event", header: "Event", render: (r) => r.event },
  { key: "user", header: "User", render: (r) => r.user },
  { key: "date", header: "Date", render: (r) => r.date, hideBelow: "sm" },
];

export default function AdminActivityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Activity
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A system-wide log of everything happening on Autopayze.
        </p>
      </div>

      <DataTable<ActivityRow>
        columns={columns}
        rows={[]}
        status="empty"
        emptyState={{
          icon: Activity,
          title: "No activity yet",
          description: "Every event across the platform — payments, sign-ups, agent runs — will be logged here.",
        }}
      />
    </div>
  );
}
