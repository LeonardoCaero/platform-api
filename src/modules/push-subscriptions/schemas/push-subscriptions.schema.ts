import { z } from 'zod';

export const subscribeSchema = z.object({
  endpoint: z.url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  lang: z.string().max(10).optional(),
});

export type SubscribeDto = z.infer<typeof subscribeSchema>;

export const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});
