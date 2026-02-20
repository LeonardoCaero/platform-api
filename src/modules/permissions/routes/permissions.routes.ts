import { Router } from 'express';
import { asyncHandler } from '@/common/utils/async-handler';
import { authMiddleware } from '@/common/middlewares/auth.middleware';
import { requirePlatformAdmin } from '@/common/middlewares/platform-admin.middleware';
import { PermissionsController } from '../controllers/permissions.controller';

const router = Router();
const permissionsController = new PermissionsController();

// All routes require authentication and platform admin
router.use(authMiddleware);
router.use(requirePlatformAdmin);

// CRUD operations
router.post('/', asyncHandler(permissionsController.create));
router.get('/', asyncHandler(permissionsController.list));
router.get('/all', asyncHandler(permissionsController.getAll)); // No pagination
router.get('/:id', asyncHandler(permissionsController.getById));
router.patch('/:id', asyncHandler(permissionsController.update));
router.delete('/:id', asyncHandler(permissionsController.delete));

export default router;
