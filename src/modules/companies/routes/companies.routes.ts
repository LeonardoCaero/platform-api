import { Router } from 'express';
import { asyncHandler } from '@/common/utils/async-handler';
import { authMiddleware } from '@/common/middlewares/auth.middleware';
import { checkPlatformAdmin } from '@/common/middlewares/platform-admin.middleware';
import { checkGlobalPermission } from '@/common/middlewares/check-global-permission.middleware';
import { CompaniesController } from '../controllers/companies.controller';

const router = Router();
const companiesController = new CompaniesController();

// All routes require authentication
router.use(authMiddleware);

// Check platform admin status for all routes (doesn't block, just adds flag)
router.use(checkPlatformAdmin);

// Create company requires global permission "company:create" (or platform admin)
router.post('/', checkGlobalPermission('company:create'), asyncHandler(companiesController.create));

router.get('/', asyncHandler(companiesController.list));
router.get('/slug/:slug', asyncHandler(companiesController.getBySlug));
router.get('/:id', asyncHandler(companiesController.getById));
router.patch('/:id', asyncHandler(companiesController.update));
router.delete('/:id', asyncHandler(companiesController.delete));
router.post('/:id/restore', asyncHandler(companiesController.restore));

export default router;
