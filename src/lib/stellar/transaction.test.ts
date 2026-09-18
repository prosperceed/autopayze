import { Account } from '@stellar/stellar-sdk';
import { describe, expect, it } from 'vitest';
import { buildPaymentTransaction } from './transaction';

describe('buildPaymentTransaction', () => {
  it('builds an XDR for a valid immediate payment', async () => {
    const sourceAddress = 'GC6VO656MIL7C4VS3MG55K7XD2NJVYJ6L5SH6IJQBXGAAWBJ4KZCJXXH';
    const destinationAddress = 'GC6VO656MIL7C4VS3MG55K7XD2NJVYJ6L5SH6IJQBXGAAWBJ4KZCJXXH';

    const result = await buildPaymentTransaction(
      {
        sourceAddress,
        destinationAddress,
        amount: '5',
        network: 'stellar-testnet',
        memo: 'Test payment',
      },
      {
        sourceAccount: new Account(sourceAddress, '1'),
      },
    );

    expect(result.preview.amount).toBe('5');
    expect(result.preview.recipient).toBe(destinationAddress);
    expect(result.xdr).toContain('AAAA');
  });
});
