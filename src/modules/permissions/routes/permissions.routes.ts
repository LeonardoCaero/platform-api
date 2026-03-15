import { Router } from 'express';
import { asyncHandler } from '@/common/utils/async-handler';
import { authMiddleware } from '@/common/middlewares/auth.middleware';
import { requirePlatformAdmin } from '@/common/middlewares/platform-admin.middleware';
import { PermissionsController } from '../controllers/permissions.controller';

const router = Router();
const permissionsController = new PermissionsController();

router.use(authMiddleware);
router.use(requirePlatformAdmin);

router.post('/', (_req, res) => res.status(403).json({ success: false, message: 'Permissions are managed via seed and cannot be created via API' }));
router.get('/', asyncHandler(permissionsController.list));
router.get('/all', asyncHandler(permissionsController.getAll));
router.get('/:id', asyncHandler(permissionsController.getById));
router.patch('/:id', asyncHandler(permissionsController.update));
router.delete('/:id', (_req, res) => res.status(403).json({ success: false, message: 'Permissions are managed via seed and cannot be deleted via API' }));

export default router;
