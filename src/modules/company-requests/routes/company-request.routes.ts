import { Router } from 'express';
import { asyncHandler } from '../../../common/utils/async-handler';
import { authMiddleware } from '../../../common/middlewares/auth.middleware';
import { checkPlatformAdmin, requirePlatformAdmin } from '../../../common/middlewares/platform-admin.middleware';
import { companyRequestController } from '../controllers/company-request.controller';

const router = Router();

// All routes require authentication
router.use(authMiddleware);
router.use(checkPlatformAdmin);

// User routes
router.post('/', asyncHandler(companyRequestController.create.bind(companyRequestController)));
router.get('/', asyncHandler(companyRequestController.getUserRequests.bind(companyRequestController)));
router.get('/:id', asyncHandler(companyRequestController.getById.bind(companyRequestController)));
router.patch('/:id', asyncHandler(companyRequestController.update.bind(companyRequestController)));
router.post('/:id/cancel', asyncHandler(companyRequestController.cancel.bind(companyRequestController)));

// Admin routes
const adminRouter = Router();
adminRouter.use(requirePlatformAdmin);
adminRouter.get('/', asyncHandler(companyRequestController.getAllRequests.bind(companyRequestController)));
adminRouter.post('/:id/review', asyncHandler(companyRequestController.review.bind(companyRequestController)));

// Mount admin routes under /admin
router.use('/admin/company-requests', adminRouter);

export default router;
