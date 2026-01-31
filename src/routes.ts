import { Router } from 'express';
import authRoutes from './modules/auth/routes/auth.routes';
import usersRoutes from './modules/users/routes/users.routes';
import companiesRoutes from './modules/companies/routes/companies.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/companies', companiesRoutes);

export default router;