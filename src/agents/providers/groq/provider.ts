import type {
  AgentIntent,
  AgentPromptPayload,
  AgentProvider,
  AgentResponsePayload,
} from '@/agents/core/agent';
import { agentSystemPrompt } from '../../prompts/system';

export function normalizeAgentIntent(payload: AgentResponsePayload): AgentIntent {
  switch (payload.intent.action) {
    case 'payment':
      return { action: 'payment', kind: 'payment' };
    case 'schedule_payment':
      return { action: 'schedule_payment', kind: 'schedule' };
    case 'airdrop':
      return { action: 'airdrop', kind: 'airdrop' };
    default:
      throw new Error('Unsupported agent intent action');
  }
}

export class GroqProvider implements AgentProvider {
  async generateStructuredIntent(input: string | AgentPromptPayload): Promise<AgentResponsePayload> {
    const prompt = typeof input === 'string' ? input : input.prompt;

    if (!prompt || !prompt.trim()) {
      throw new Error('No agent input provided');
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    const body = {
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'autopayze_agent_response',
          schema: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['accepted', 'review_required', 'rejected'] },
              summary: { type: 'string' },
              intent: {
                type: 'object',
                properties: {
                  action: { type: 'string', enum: ['payment', 'schedule_payment', 'airdrop'] },
                  recipient: { type: 'string' },
                  amount: { type: 'string' },
                  asset: { type: 'string', enum: ['XLM', 'USDC', 'USDT'] },
                  network: { type: 'string', enum: ['stellar-testnet', 'stellar-mainnet'] },
                  execution: { type: 'string', enum: ['immediate', 'scheduled'] },
                  scheduledFor: { type: ['string', 'null'] },
                  memo: { type: ['string', 'null'] },
                  frequency: { type: 'string', enum: ['once', 'daily', 'weekly', 'monthly'] },
                  startAt: { type: 'string' },
                  endAt: { type: ['string', 'null'] },
                  occurrences: { type: ['integer', 'null'] },
                  recipients: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        address: { type: 'string' },
                        amount: { type: 'string' },
                      },
                      required: ['address', 'amount'],
                    },
                  },
                },
                required: ['action'],
              },
            },
            required: ['status', 'summary', 'intent'],
          },
        },
      },
      messages: [
        { role: 'system', content: agentSystemPrompt },
        {
          role: 'user',
          content: `Convert this user request into a structured Autopayze intent. The user may want a payment, a scheduled payment, or an airdrop. If the request is ambiguous, use "review_required".\n\nUser request: ${prompt}`,
        },
      ],
    };

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Groq request failed: ${response.status} ${errorBody}`);
    }

    const json = await response.json();
    const content = json?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Groq returned no content');
    }

    return JSON.parse(content) as AgentResponsePayload;
  }

  async generateIntent(input: string | AgentPromptPayload): Promise<AgentIntent> {
    const parsed = await this.generateStructuredIntent(input);
    return normalizeAgentIntent(parsed);
  }
}
