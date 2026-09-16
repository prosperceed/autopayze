import { z } from 'zod';

export const agentResponseSchema = z.object({
  status: z.enum(['accepted', 'review_required', 'rejected']),
  summary: z.string().min(1),
  intent: z.union([
    z.object({ action: z.literal('payment') }),
    z.object({ action: z.literal('schedule_payment') }),
    z.object({ action: z.literal('airdrop') }),
  ]),
});

export type AgentResponse = z.infer<typeof agentResponseSchema>;
