import type { AgentIntent, AgentProvider } from '@/agents/core/agent';

export class GroqProvider implements AgentProvider {
  async generateIntent(input: string): Promise<AgentIntent> {
    if (!input.trim()) {
      throw new Error('No agent input provided');
    }

    return {
      action: 'payment',
      kind: 'payment',
    };
  }
}
