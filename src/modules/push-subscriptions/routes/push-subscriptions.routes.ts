import { Router } from 'express';
import { asyncHandler } from '@/common/utils/async-handler';
import { authMiddleware } from '@/common/middlewares/auth.middleware';
import { checkPlatformAdmin } from '@/common/middlewares/platform-admin.middleware';
import { PushSubscriptionsController } from '../controllers/push-subscriptions.controller';

const router = Router();
const ctrl = new PushSubscriptionsController();

// Public
router.get('/vapid-public-key', ctrl.getVapidPublicKey.bind(ctrl));

// Protected
router.use(authMiddleware);
router.post('/subscribe', asyncHandler(ctrl.subscribe.bind(ctrl)));
router.post('/unsubscribe', asyncHandler(ctrl.unsubscribe.bind(ctrl)));
router.post('/test', asyncHandler(ctrl.test.bind(ctrl)));
router.get('/subscriptions/me', asyncHandler(ctrl.listMine.bind(ctrl)));

// Platform admin only
router.get('/subscriptions', checkPlatformAdmin, asyncHandler(ctrl.listAll.bind(ctrl)));
router.post('/test/:userId', checkPlatformAdmin, asyncHandler(ctrl.testToUser.bind(ctrl)));

export default router;
