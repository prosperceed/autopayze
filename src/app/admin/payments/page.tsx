"use client";

import { Repeat } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/data-table";

type PaymentRow = {
  id: string;
  user: string;
  amount: string;
  recipient: string;
  status: string;
  date: string;
};

const columns: Column<PaymentRow>[] = [
  { key: "user", header: "User", render: (r) => r.user },
  { key: "amount", header: "Amount", render: (r) => r.amount },
  {
    key: "recipient",
    header: "Recipient",
    render: (r) => r.recipient,
    hideBelow: "sm",
  },
  { key: "status", header: "Status", render: (r) => r.status },
  { key: "date", header: "Date", render: (r) => r.date, hideBelow: "md" },
];

export default function AdminPaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Payments
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every payment sent across all users.
        </p>
      </div>

      <DataTable<PaymentRow>
        columns={columns}
        rows={[]}
        status="empty"
        searchPlaceholder="Search payments"
        onSearchChange={() => {}}
        emptyState={{
          icon: Repeat,
          title: "No payments yet",
          description: "Payments users send will be listed here with status and amount.",
        }}
      />
    </div>
  );
}
