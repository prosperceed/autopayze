import { Account, Horizon } from '@stellar/stellar-sdk';
import { describe, expect, it } from 'vitest';
import { buildPaymentTransaction } from './transaction';

// ---------------------------------------------------------------------------
// Minimal Horizon.Server stub
// Simulates an existing, funded account so buildPaymentTransaction's
// destination-existence check succeeds without a live network call.
// ---------------------------------------------------------------------------
const TEST_ADDRESS = 'GC6VO656MIL7C4VS3MG55K7XD2NJVYJ6L5SH6IJQBXGAAWBJ4KZCJXXH';

function makeMockServer(
  balances: Horizon.HorizonApi.BalanceLine[] = [
    { asset_type: 'native', balance: '100.0000000', buying_liabilities: '0', selling_liabilities: '0' },
  ],
): Horizon.Server {
  return {
    loadAccount: async (_address: string) => ({
      id: TEST_ADDRESS,
      sequence: '100',
      balances,
    }),
  } as unknown as Horizon.Server;
}

describe('buildPaymentTransaction', () => {
  it('builds an XDR for a valid immediate payment', async () => {
    const result = await buildPaymentTransaction(
      {
        sourceAddress: TEST_ADDRESS,
        destinationAddress: TEST_ADDRESS,
        amount: '5',
        network: 'stellar-testnet',
        memo: 'Test payment',
      },
      {
        sourceAccount: new Account(TEST_ADDRESS, '1'),
        server: makeMockServer(),
      },
    );

    expect(result.preview.amount).toBe('5');
    expect(result.preview.recipient).toBe(TEST_ADDRESS);
    expect(result.xdr).toContain('AAAA');
  });

  it('builds a transaction with custom memo and asset', async () => {
    const result = await buildPaymentTransaction(
      {
        sourceAddress: TEST_ADDRESS,
        destinationAddress: TEST_ADDRESS,
        amount: '12.5',
        asset: 'XLM',
        network: 'stellar-testnet',
        memo: 'Salary disbursement',
      },
      {
        sourceAccount: new Account(TEST_ADDRESS, '100'),
        server: makeMockServer(),
      },
    );

    expect(result.preview.amount).toBe('12.5');
    expect(result.preview.memo).toBe('Salary disbursement');
    expect(result.preview.approved).toBe(true);
  });
});
