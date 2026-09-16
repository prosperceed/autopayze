import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { paymentIntentSchema, validateStellarAddress } from './validation';

const validPublicKey = 'GC6VO656MIL7C4VS3MG55K7XD2NJVYJ6L5SH6IJQBXGAAWBJ4KZCJXXH';

describe('validateStellarAddress', () => {
  it('accepts valid testnet public key', () => {
    expect(validateStellarAddress(validPublicKey)).toBe(true);
  });

  it('rejects malformed addresses', () => {
    expect(validateStellarAddress('not-a-valid-address')).toBe(false);
  });
});

describe('paymentIntentSchema', () => {
  it('accepts valid payment intent payloads', () => {
    const payload = {
      action: 'payment',
      recipient: validPublicKey,
      amount: '50',
      asset: 'USDC',
      network: 'stellar-testnet',
      execution: 'immediate',
      scheduledFor: null,
      memo: 'Monthly payroll',
    };

    expect(() => paymentIntentSchema.parse(payload)).not.toThrow();
  });

  it('rejects invalid network or amount', () => {
    const invalid = {
      action: 'payment',
      recipient: 'invalid',
      amount: '-1',
      asset: 'BTC',
      network: 'stellar-mainnet',
      execution: 'immediate',
      scheduledFor: null,
      memo: null,
    };

    expect(() => paymentIntentSchema.parse(invalid)).toThrow(z.ZodError);
  });
});
