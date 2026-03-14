import webpush from 'web-push';
import { prisma } from '@/db/prisma';
import type { PushPayload } from '../push.i18n';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:admin@example.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export class PushSubscriptionsService {
  getVapidPublicKey() {
    return vapidPublicKey ?? null;
  }

  async subscribe(userId: string, data: { endpoint: string; p256dh: string; auth: string; lang?: string }) {
    await prisma.pushSubscription.upsert({
      where: { endpoint: data.endpoint },
      create: { userId, endpoint: data.endpoint, p256dh: data.p256dh, auth: data.auth, lang: data.lang ?? 'en' },
      update: { userId, lang: data.lang ?? 'en' },
    });
  }

  async unsubscribe(endpoint: string) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  }

  async listForUser(userId: string) {
    return prisma.pushSubscription.findMany({
      where: { userId },
      select: { id: true, endpoint: true, lang: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

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
          }
        });
    });

    await Promise.allSettled(sends);
  }
}

export const pushService = new PushSubscriptionsService();
