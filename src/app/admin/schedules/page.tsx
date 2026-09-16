"use client";

import { Repeat } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/data-table";

type ScheduleRow = {
  id: string;
  user: string;
  frequency: string;
  nextRun: string;
  status: string;
};

const columns: Column<ScheduleRow>[] = [
  { key: "user", header: "User", render: (r) => r.user },
  { key: "frequency", header: "Frequency", render: (r) => r.frequency },
  {
    key: "nextRun",
    header: "Next run",
    render: (r) => r.nextRun,
    hideBelow: "sm",
  },
  { key: "status", header: "Status", render: (r) => r.status },
];

export default function AdminSchedulesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Schedules
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Recurring payment rules set by users.
        </p>
      </div>

      <DataTable<ScheduleRow>
        columns={columns}
        rows={[]}
        status="empty"
        emptyState={{
          icon: Repeat,
          title: "No schedules yet",
          description: "Recurring payment rules users set up will show here.",
        }}
      />
    </div>
  );
}
