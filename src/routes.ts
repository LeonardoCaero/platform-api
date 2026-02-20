import { Router } from 'express';
import authRoutes from './modules/auth/routes/auth.routes';
import usersRoutes from './modules/users/routes/users.routes';
import companiesRoutes from './modules/companies/routes/companies.routes';
import companyRequestRoutes from './modules/company-requests/routes/company-request.routes';
import permissionRequestRoutes from './modules/permission-requests/routes/permission-request.routes';
import permissionsRoutes from './modules/permissions/routes/permissions.routes';
import timeEntriesRoutes from './modules/time-tracker/routes/time-entries.routes';
import projectsRoutes from './modules/time-tracker/routes/projects.routes';
import invitationsRoutes from './modules/memberships/routes/invitations.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/companies', companiesRoutes);
router.use('/company-requests', companyRequestRoutes);
router.use('/permission-requests', permissionRequestRoutes);
router.use('/permissions', permissionsRoutes);
router.use('/time-entries', timeEntriesRoutes);
router.use('/projects', projectsRoutes);
router.use('/invitations', invitationsRoutes);

export default router;