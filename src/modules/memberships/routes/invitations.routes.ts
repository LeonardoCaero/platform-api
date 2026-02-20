import { Router } from 'express';
import { asyncHandler } from '@/common/utils/async-handler';
import { authMiddleware } from '@/common/middlewares/auth.middleware';
import { InvitationsController } from '../controllers/invitations.controller';

const router = Router();
const ctrl = new InvitationsController();

router.use(authMiddleware);

router.get('/', asyncHandler(ctrl.getPending));
router.post('/:membershipId/accept', asyncHandler(ctrl.accept));
router.post('/:membershipId/decline', asyncHandler(ctrl.decline));

export default router;
