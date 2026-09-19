import { describe, expect, it } from 'vitest';
import { savePromptHistory, saveTransactionHistory, updateTransactionStatus } from './agent-history';

describe('agent-history resilience', () => {
  it('handles missing DB tables gracefully without throwing unhandled rejections', async () => {
    const promptResult = await savePromptHistory({
      user_id: 'test-user-id',
      wallet_address: 'GC6VO656MIL7C4VS3MG55K7XD2NJVYJ6L5SH6IJQBXGAAWBJ4KZCJXXH',
      wallet_network: 'stellar-testnet',
      prompt_text: 'Send 5 XLM',
      response_summary: 'Sending 5 XLM to destination',
      action_type: 'payment',
      intent_payload: { action: 'payment', amount: '5' },
      status: 'accepted',
    });

    // Should return an object with recorded status instead of crashing
    expect(typeof promptResult).toBe('object');
    expect('recorded' in promptResult).toBe(true);

    const txResult = await saveTransactionHistory({
      user_id: 'test-user-id',
      wallet_address: 'GC6VO656MIL7C4VS3MG55K7XD2NJVYJ6L5SH6IJQBXGAAWBJ4KZCJXXH',
      wallet_network: 'stellar-testnet',
      action_type: 'payment',
      prompt_text: 'Send 5 XLM',
      summary: 'Sending 5 XLM to destination',
      intent_payload: { action: 'payment', amount: '5' },
      status: 'accepted',
      amount: '5',
      asset: 'XLM',
    });

    expect(typeof txResult).toBe('object');
    expect('recorded' in txResult).toBe(true);

    const updateResult = await updateTransactionStatus({
      userId: 'test-user-id',
      status: 'executed',
      txHash: 'sample-hash',
    });

    expect(typeof updateResult).toBe('object');
    expect('updated' in updateResult).toBe(true);
  });
});

