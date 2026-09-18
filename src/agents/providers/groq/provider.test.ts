import { describe, expect, it } from 'vitest';
import { normalizeAgentIntent } from './provider';

describe('normalizeAgentIntent', () => {
  it('maps a payment payload to the agent action contract', () => {
    expect(
      normalizeAgentIntent({
        status: 'accepted',
        summary: 'Send 25 USDC to a recipient',
        intent: {
          action: 'payment',
          recipient: 'GCVK5Z....',
          amount: '25',
          asset: 'USDC',
          network: 'stellar-testnet',
          execution: 'immediate',
          scheduledFor: null,
          memo: 'Invoice 104',
        },
      }),
    ).toEqual({ action: 'payment', kind: 'payment' });
  });

  it('maps a scheduled payment payload to the schedule action', () => {
    expect(
      normalizeAgentIntent({
        status: 'accepted',
        summary: 'Schedule a weekly payment',
        intent: {
          action: 'schedule_payment',
          recipient: 'GCVK5Z....',
          amount: '100',
          asset: 'XLM',
          frequency: 'weekly',
          startAt: '2026-10-01T00:00:00.000Z',
          endAt: null,
          occurrences: 4,
        },
      }),
    ).toEqual({ action: 'schedule_payment', kind: 'schedule' });
  });
});
