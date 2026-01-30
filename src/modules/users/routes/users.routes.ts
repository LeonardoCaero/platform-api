import { Router } from 'express';
import { asyncHandler } from '@/common/utils/async-handler';
import { authMiddleware } from '@/common/middlewares/auth.middleware';
import { UsersController } from '../controllers/users.controller';

const router = Router();
const usersController = new UsersController();

// All routes require authentication
router.use(authMiddleware);

router.get('/', asyncHandler(usersController.list));
router.get('/:id', asyncHandler(usersController.getById));
router.patch('/:id', asyncHandler(usersController.update));
router.patch('/:id/password', asyncHandler(usersController.changePassword));
router.delete('/:id', asyncHandler(usersController.disable));

export default router;
