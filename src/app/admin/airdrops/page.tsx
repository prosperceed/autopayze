"use client";

import { Gift } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/data-table";

type AirdropRow = {
  id: string;
  name: string;
  recipients: number;
  amountEach: string;
  status: string;
};

const columns: Column<AirdropRow>[] = [
  { key: "name", header: "Airdrop", render: (r) => r.name },
  {
    key: "recipients",
    header: "Recipients",
    render: (r) => r.recipients,
  },
  {
    key: "amountEach",
    header: "Amount each",
    render: (r) => r.amountEach,
    hideBelow: "sm",
  },
  { key: "status", header: "Status", render: (r) => r.status },
];

export default function AdminAirdropsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Airdrops
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Batch token distributions across all users.
        </p>
      </div>

      <DataTable<AirdropRow>
        columns={columns}
        rows={[]}
        status="empty"
        emptyState={{
          icon: Gift,
          title: "No airdrops yet",
          description: "Airdrops users run will be listed here with recipient counts.",
        }}
      />
    </div>
  );
}
