import { Router } from 'express';
import { asyncHandler } from '@/common/utils/async-handler';
import { authMiddleware } from '@/common/middlewares/auth.middleware';
import { checkPlatformAdmin, requirePlatformAdmin } from '@/common/middlewares/platform-admin.middleware';
import { CompanyRequestController } from '../controllers/company-request.controller';

const router = Router();
const companyRequestController = new CompanyRequestController();

// All routes require authentication
router.use(authMiddleware);
router.use(checkPlatformAdmin);

// Admin routes (must be mounted before /:id to avoid shadowing)
const adminRouter = Router();
adminRouter.use(requirePlatformAdmin);
adminRouter.get('/', asyncHandler(companyRequestController.getAllRequests));
adminRouter.post('/:id/review', asyncHandler(companyRequestController.review));

router.use('/admin', adminRouter);

// User routes
router.post('/', asyncHandler(companyRequestController.create));
router.get('/', asyncHandler(companyRequestController.getUserRequests));
router.get('/:id', asyncHandler(companyRequestController.getById));
router.patch('/:id', asyncHandler(companyRequestController.update));
router.post('/:id/cancel', asyncHandler(companyRequestController.cancel));

export default router;
