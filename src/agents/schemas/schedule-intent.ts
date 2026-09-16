import { z } from 'zod';

export const scheduleIntentDefinition = z.object({
  action: z.literal('schedule_payment'),
  recipient: z.string().min(1),
  amount: z.string().min(1),
  asset: z.enum(['XLM', 'USDC', 'USDT']),
  frequency: z.enum(['once', 'daily', 'weekly', 'monthly']),
  startAt: z.string().min(1),
  endAt: z.string().nullable(),
  occurrences: z.number().int().positive().nullable(),
});

export type ScheduleIntentDefinition = z.infer<typeof scheduleIntentDefinition>;
