import webpush from 'web-push';
import { prisma } from '@/db/prisma';
import { env } from '@/config/env';
import { logger } from '@/common/logger/logger';
import type { PushPayload } from '../push.i18n';

const vapidPublicKey = env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = env.VAPID_PRIVATE_KEY;
const vapidSubject = env.VAPID_SUBJECT;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export class PushSubscriptionsService {
  /** Return the VAPID public key (null if push is not configured). */
  getVapidPublicKey() {
    return vapidPublicKey ?? null;
  }

  /** Register or update a push subscription for a user. */
  async subscribe(userId: string, data: { endpoint: string; p256dh: string; auth: string; lang?: string }) {
    await prisma.pushSubscription.upsert({
      where: { endpoint: data.endpoint },
      create: { userId, endpoint: data.endpoint, p256dh: data.p256dh, auth: data.auth, lang: data.lang ?? 'en' },
      update: { userId, lang: data.lang ?? 'en' },
    });
  }

  /** Remove a push subscription by endpoint. */
  async unsubscribe(endpoint: string) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  }

  /** List all push subscriptions for a user. */
  async listForUser(userId: string) {
    return prisma.pushSubscription.findMany({
      where: { userId },
      select: { id: true, endpoint: true, lang: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** List all push subscriptions (admin only). */
  async listAll() {
    return prisma.pushSubscription.findMany({
      select: {
        id: true,
        endpoint: true,
        lang: true,
        createdAt: true,
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Send a push notification to all subscriptions of a user. Stale subscriptions (410) are auto-removed. */
  async sendToUser(userId: string, buildPayload: (lang: string) => PushPayload): Promise<void> {
    if (!vapidPublicKey || !vapidPrivateKey) return;

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
      select: { id: true, endpoint: true, p256dh: true, auth: true, lang: true },
    });
    if (subscriptions.length === 0) return;

    const sends = subscriptions.map(sub => {
      const payload = buildPayload(sub.lang ?? 'en');
      return webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        )
        .catch(async (err: any) => {
          if (err.statusCode === 410) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          } else {
            logger.error(`[Push] Failed to send to subscription ${sub.id} (status ${err.statusCode ?? 'unknown'}): ${err.message}`);
          }
        });
    });

    await Promise.allSettled(sends);
  }
}

export const pushService = new PushSubscriptionsService();
