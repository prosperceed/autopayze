"use client";

import { Users } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/data-table";

type UserRow = {
  id: string;
  email: string;
  role: string;
  wallets: number;
  joined: string;
};

const columns: Column<UserRow>[] = [
  { key: "email", header: "Email", render: (r) => r.email },
  { key: "role", header: "Role", render: (r) => r.role, hideBelow: "sm" },
  {
    key: "wallets",
    header: "Wallets",
    render: (r) => r.wallets,
    hideBelow: "md",
  },
  { key: "joined", header: "Joined", render: (r) => r.joined, hideBelow: "md" },
];

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Users
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everyone with an Autopayze account.
        </p>
      </div>

      <DataTable<UserRow>
        columns={columns}
        rows={[]}
        status="empty"
        searchPlaceholder="Search by email"
        onSearchChange={() => {}}
        emptyState={{
          icon: Users,
          title: "No users yet",
          description: "Users will appear here once accounts start signing up.",
        }}
      />
    </div>
  );
}
