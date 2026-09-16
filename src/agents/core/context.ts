export type AgentContext = {
  userId: string | null;
  walletAddress: string | null;
  network: string | null;
  timestamp: string;
};

export function buildAgentContext(input: Partial<AgentContext>): AgentContext {
  return {
    userId: input.userId ?? null,
    walletAddress: input.walletAddress ?? null,
    network: input.network ?? null,
    timestamp: input.timestamp ?? new Date().toISOString(),
  };
}
