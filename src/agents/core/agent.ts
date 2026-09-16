export type AgentIntent =
  | { action: 'payment'; kind: 'payment' }
  | { action: 'schedule_payment'; kind: 'schedule' }
  | { action: 'airdrop'; kind: 'airdrop' };

export interface AgentProvider {
  generateIntent(input: string): Promise<AgentIntent>;
}
