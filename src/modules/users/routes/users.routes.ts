import { Router } from 'express';
import { asyncHandler } from '@/common/utils/async-handler';
import { authMiddleware } from '@/common/middlewares/auth.middleware';
import { checkPlatformAdmin } from '@/common/middlewares/platform-admin.middleware';
import { UsersController } from '../controllers/users.controller';

const router = Router();
const usersController = new UsersController();

// All routes require authentication
router.use(authMiddleware);

// Check platform admin status (doesn't block, just adds flag)
router.use(checkPlatformAdmin);

router.get('/', asyncHandler(usersController.list));
router.get('/:id', asyncHandler(usersController.getById));
router.patch('/:id', asyncHandler(usersController.update));
router.patch('/:id/password', asyncHandler(usersController.changePassword));
router.delete('/:id', asyncHandler(usersController.disable));

export default router;
