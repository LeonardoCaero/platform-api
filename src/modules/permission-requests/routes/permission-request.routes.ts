import { Router } from 'express';
import { asyncHandler } from '../../../common/utils/async-handler';
import { authMiddleware } from '../../../common/middlewares/auth.middleware';
import { checkPlatformAdmin, requirePlatformAdmin } from '../../../common/middlewares/platform-admin.middleware';
import { PermissionRequestController } from '../controllers/permission-request.controller';

const router = Router();
const permissionRequestController = new PermissionRequestController();

// All routes require authentication
router.use(authMiddleware);
router.use(checkPlatformAdmin);

// Get available permissions
router.get('/available-permissions', asyncHandler(permissionRequestController.getAvailablePermissions));

// User routes
router.post('/', asyncHandler(permissionRequestController.create));
router.get('/', asyncHandler(permissionRequestController.getUserRequests));
router.get('/:id', asyncHandler(permissionRequestController.getById));
router.patch('/:id', asyncHandler(permissionRequestController.update));
router.post('/:id/cancel', asyncHandler(permissionRequestController.cancel));

// Admin routes (require platform admin)
router.get('/admin/all', requirePlatformAdmin, asyncHandler(permissionRequestController.getAllRequests));
router.post('/admin/:id/review', requirePlatformAdmin, asyncHandler(permissionRequestController.review));

export default router;
