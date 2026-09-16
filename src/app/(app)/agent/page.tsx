import { Bot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default function AgentPage() {
  return (
    <div className="flex h-full flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          AI agent
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell the agent what you want to happen with your wallet. It plans the transactions and asks before anything irreversible.
        </p>
      </div>

      <Card className="flex flex-1 flex-col">
        <CardContent className="flex flex-1 flex-col pt-5">
          <div className="flex-1">
            <EmptyState
              icon={Bot}
              title="Agent not connected yet"
              description="The agent will appear here once it's wired up to your wallet and payment rules. Nothing you type here is sent anywhere yet."
            />
          </div>

          <form className="mt-4 flex items-center gap-2">
            <input
              type="text"
              disabled
              placeholder="Ask the agent to set up a payment…"
              className="h-11 flex-1 rounded-md border border-border bg-input px-3 text-sm text-foreground placeholder:text-muted-foreground disabled:opacity-60"
            />
            <button
              type="submit"
              disabled
              className="h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
