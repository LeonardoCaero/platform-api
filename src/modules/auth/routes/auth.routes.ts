import { Router } from 'express';
import { asyncHandler } from '@/common/utils/async-handler';
import { authMiddleware } from '@/common/middlewares/auth.middleware';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.post('/refresh', authMiddleware, asyncHandler(authController.refresh));
router.post('/logout', authMiddleware, asyncHandler(authController.logout));
router.get('/me', authMiddleware, asyncHandler(authController.me));

export default router;