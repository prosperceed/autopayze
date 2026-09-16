import { z } from 'zod';

export const airdropRecipientDefinition = z.object({
  address: z.string().min(1),
  amount: z.string().min(1),
});

export const airdropIntentDefinition = z.object({
  action: z.literal('airdrop'),
  asset: z.enum(['XLM', 'USDC', 'USDT']),
  recipients: z.array(airdropRecipientDefinition).min(1),
});

export type AirdropIntentDefinition = z.infer<typeof airdropIntentDefinition>;
