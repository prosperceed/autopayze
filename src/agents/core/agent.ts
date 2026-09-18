export type AgentIntent =
  | { action: 'payment'; kind: 'payment' }
  | { action: 'schedule_payment'; kind: 'schedule' }
  | { action: 'airdrop'; kind: 'airdrop' };

export type AgentPromptPayload = {
  prompt: string;
  userId?: string | null;
  walletAddress?: string | null;
  network?: string | null;
};

export type AgentResponsePayload = {
  status: 'accepted' | 'review_required' | 'rejected';
  summary: string;
  intent:
    | {
        action: 'payment';
        recipient: string;
        amount: string;
        asset: 'XLM' | 'USDC' | 'USDT';
        network: 'stellar-testnet' | 'stellar-mainnet';
        execution: 'immediate' | 'scheduled';
        scheduledFor: string | null;
        memo: string | null;
      }
    | {
        action: 'schedule_payment';
        recipient: string;
        amount: string;
        asset: 'XLM' | 'USDC' | 'USDT';
        frequency: 'once' | 'daily' | 'weekly' | 'monthly';
        startAt: string;
        endAt: string | null;
        occurrences: number | null;
      }
    | {
        action: 'airdrop';
        asset: 'XLM' | 'USDC' | 'USDT';
        recipients: Array<{ address: string; amount: string }>;
      };
};

export interface AgentProvider {
  generateIntent(input: string | AgentPromptPayload): Promise<AgentIntent>;
  generateStructuredIntent?(input: string | AgentPromptPayload): Promise<AgentResponsePayload>;
}
