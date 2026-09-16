import type { AgentIntent, AgentProvider } from './agent';

export class AgentOrchestrator {
  constructor(private provider: AgentProvider) {}

  async interpret(input: string): Promise<AgentIntent> {
    return this.provider.generateIntent(input);
  }
}
