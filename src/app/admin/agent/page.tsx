"use client";

import { Bot } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/data-table";

type AgentRunRow = {
  id: string;
  user: string;
  action: string;
  outcome: string;
  date: string;
};

const columns: Column<AgentRunRow>[] = [
  { key: "user", header: "User", render: (r) => r.user },
  { key: "action", header: "Action", render: (r) => r.action },
  { key: "outcome", header: "Outcome", render: (r) => r.outcome },
  { key: "date", header: "Date", render: (r) => r.date, hideBelow: "sm" },
];

export default function AdminAgentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          AI agent
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Actions the agent has taken on behalf of users.
        </p>
      </div>

      <DataTable<AgentRunRow>
        columns={columns}
        rows={[]}
        status="empty"
        emptyState={{
          icon: Bot,
          title: "No agent runs yet",
          description: "Once the agent is connected, its actions and their outcomes will be logged here.",
        }}
      />
    </div>
  );
}
