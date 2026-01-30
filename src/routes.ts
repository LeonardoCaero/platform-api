import { Router } from 'express';
import authRoutes from './modules/auth/routes/auth.routes';
import usersRoutes from './modules/users/routes/users.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);

export default router;