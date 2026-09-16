"use client";

import { Wallet } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/data-table";

type WalletRow = {
  id: string;
  user: string;
  address: string;
  chain: string;
  connected: string;
};

const columns: Column<WalletRow>[] = [
  { key: "user", header: "User", render: (r) => r.user },
  { key: "address", header: "Address", render: (r) => r.address },
  { key: "chain", header: "Chain", render: (r) => r.chain, hideBelow: "sm" },
  {
    key: "connected",
    header: "Connected",
    render: (r) => r.connected,
    hideBelow: "md",
  },
];

export default function AdminWalletsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Wallets
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Wallets connected across all users.
        </p>
      </div>

      <DataTable<WalletRow>
        columns={columns}
        rows={[]}
        status="empty"
        searchPlaceholder="Search by address"
        onSearchChange={() => {}}
        emptyState={{
          icon: Wallet,
          title: "No wallets connected",
          description: "Wallets users connect will appear here.",
        }}
      />
    </div>
  );
}
