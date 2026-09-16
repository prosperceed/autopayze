import { StrKey } from '@stellar/stellar-sdk';
import { z } from 'zod';

export const stellarNetworkSchema = z.enum(['stellar-testnet', 'stellar-mainnet']);

export const paymentIntentSchema = z.object({
  action: z.literal('payment'),
  recipient: z.string().min(1, 'Recipient is required').refine(validateStellarAddress, {
    message: 'Recipient must be a valid Stellar public key',
  }),
  amount: z.string().refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
    message: 'Amount must be a positive number',
  }),
  asset: z.enum(['XLM', 'USDC', 'USDT']),
  network: stellarNetworkSchema,
  execution: z.enum(['immediate', 'scheduled']),
  scheduledFor: z.string().nullable(),
  memo: z.string().nullable(),
});

export const scheduleIntentSchema = z.object({
  action: z.literal('schedule_payment'),
  recipient: z.string().min(1).refine(validateStellarAddress, {
    message: 'Recipient must be a valid Stellar public key',
  }),
  amount: z.string().refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0),
  asset: z.enum(['XLM', 'USDC', 'USDT']),
  frequency: z.enum(['once', 'daily', 'weekly', 'monthly']),
  startAt: z.string().min(1),
  endAt: z.string().nullable(),
  occurrences: z.number().int().positive().nullable(),
});

export const airdropRecipientSchema = z.object({
  address: z.string().min(1).refine(validateStellarAddress, {
    message: 'Each recipient must have a valid Stellar public key',
  }),
  amount: z.string().refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0),
});

export const airdropIntentSchema = z.object({
  action: z.literal('airdrop'),
  asset: z.enum(['XLM', 'USDC', 'USDT']),
  recipients: z.array(airdropRecipientSchema).min(1).refine((items) => {
    const values = items.map((item) => item.address);
    return new Set(values).size === values.length;
  }, 'Duplicate addresses are not allowed'),
});

export type PaymentIntent = z.infer<typeof paymentIntentSchema>;
export type ScheduleIntent = z.infer<typeof scheduleIntentSchema>;
export type AirdropIntent = z.infer<typeof airdropIntentSchema>;

export function validateStellarAddress(value: string): boolean {
  return StrKey.isValidEd25519PublicKey(value.trim());
}
