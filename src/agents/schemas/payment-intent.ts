import { z } from 'zod';

export const paymentIntentDefinition = z.object({
  action: z.literal('payment'),
  recipient: z.string().min(1),
  amount: z.string().min(1),
  asset: z.enum(['XLM', 'USDC', 'USDT']),
  network: z.enum(['stellar-testnet', 'stellar-mainnet']),
  execution: z.enum(['immediate', 'scheduled']),
  scheduledFor: z.string().nullable(),
  memo: z.string().nullable(),
});

export type PaymentIntentDefinition = z.infer<typeof paymentIntentDefinition>;
