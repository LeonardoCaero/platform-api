import type { Request, Response } from 'express';
import { PushSubscriptionsService } from '../services/push-subscriptions.service';
import { subscribeSchema, unsubscribeSchema } from '../schemas/push-subscriptions.schema';

const pushService = new PushSubscriptionsService();

export class PushSubscriptionsController {
  getVapidPublicKey(req: Request, res: Response) {
    const key = pushService.getVapidPublicKey();
    if (!key) {
      return res.status(503).json({ success: false, message: 'Push notifications not configured' });
    }
    res.json({ success: true, data: { publicKey: key } });
  }

  async subscribe(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { endpoint, keys, lang } = subscribeSchema.parse(req.body);
    await pushService.subscribe(userId, { endpoint, p256dh: keys.p256dh, auth: keys.auth, lang });
    res.status(201).json({ success: true });
  }

  async unsubscribe(req: Request, res: Response) {
    const { endpoint } = unsubscribeSchema.parse(req.body);
    await pushService.unsubscribe(endpoint);
    res.json({ success: true });
  }

  async test(req: Request, res: Response) {
    const userId = req.user!.userId;
    await pushService.sendToUser(userId, () => ({
      title: '🔔 Test notification',
      body: 'Push notifications are working correctly.',
      url: '/',
    }));
    res.json({ success: true, message: 'Notification sent' });
  }

  async testToUser(req: Request, res: Response) {
    const { userId } = req.params;
    await pushService.sendToUser(userId, () => ({
      title: '🔔 Test notification',
      body: `Sent to user ${userId}`,
      url: '/',
    }));
    res.json({ success: true, message: `Notification sent to ${userId}` });
  }

  async listMine(req: Request, res: Response) {
    const userId = req.user!.userId;
    const subs = await pushService.listForUser(userId);
    res.json({ success: true, data: subs });
  }

  async listAll(req: Request, res: Response) {
    const subs = await pushService.listAll();
    res.json({ success: true, data: subs });
  }
}
