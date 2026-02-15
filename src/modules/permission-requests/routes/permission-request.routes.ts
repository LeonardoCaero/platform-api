import { Router } from 'express';
import { asyncHandler } from '../../../common/utils/async-handler';
import { authMiddleware } from '../../../common/middlewares/auth.middleware';
import { checkPlatformAdmin, requirePlatformAdmin } from '../../../common/middlewares/platform-admin.middleware';
import { permissionRequestController } from '../controllers/permission-request.controller';

const router = Router();

// All routes require authentication
router.use(authMiddleware);
router.use(checkPlatformAdmin);

// Get available permissions
router.get('/available-permissions', asyncHandler(permissionRequestController.getAvailablePermissions.bind(permissionRequestController)));

// User routes
router.post('/', asyncHandler(permissionRequestController.create.bind(permissionRequestController)));
router.get('/', asyncHandler(permissionRequestController.getUserRequests.bind(permissionRequestController)));
router.get('/:id', asyncHandler(permissionRequestController.getById.bind(permissionRequestController)));
router.patch('/:id', asyncHandler(permissionRequestController.update.bind(permissionRequestController)));
router.post('/:id/cancel', asyncHandler(permissionRequestController.cancel.bind(permissionRequestController)));

// Admin routes (require platform admin)
router.get('/admin/all', requirePlatformAdmin, asyncHandler(permissionRequestController.getAllRequests.bind(permissionRequestController)));
router.post('/admin/:id/review', requirePlatformAdmin, asyncHandler(permissionRequestController.review.bind(permissionRequestController)));

export default router;
