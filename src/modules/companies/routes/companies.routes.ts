import { Router } from 'express';
import { asyncHandler } from '@/common/utils/async-handler';
import { authMiddleware } from '@/common/middlewares/auth.middleware';
import { CompaniesController } from '../controllers/companies.controller';

const router = Router();
const companiesController = new CompaniesController();

// All routes require authentication
router.use(authMiddleware);

router.post('/', asyncHandler(companiesController.create));
router.get('/', asyncHandler(companiesController.list));
router.get('/slug/:slug', asyncHandler(companiesController.getBySlug));
router.get('/:id', asyncHandler(companiesController.getById));
router.patch('/:id', asyncHandler(companiesController.update));
router.delete('/:id', asyncHandler(companiesController.delete));
router.post('/:id/restore', asyncHandler(companiesController.restore));

export default router;
