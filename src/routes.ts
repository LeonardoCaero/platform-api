import { Router } from 'express';
import authRoutes from './modules/auth/routes/auth.routes';
import usersRoutes from './modules/users/routes/users.routes';
import companiesRoutes from './modules/companies/routes/companies.routes';
import companyRequestRoutes from './modules/company-requests/routes/company-request.routes';
import permissionRequestRoutes from './modules/permission-requests/routes/permission-request.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/companies', companiesRoutes);
router.use('/company-requests', companyRequestRoutes);
router.use('/permission-requests', permissionRequestRoutes);

export default router;