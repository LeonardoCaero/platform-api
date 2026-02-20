import { Router } from 'express';
import { asyncHandler } from '@/common/utils/async-handler';
import { authMiddleware } from '@/common/middlewares/auth.middleware';
import { checkPlatformAdmin } from '@/common/middlewares/platform-admin.middleware';
import { ProjectsController } from '../controllers/projects.controller';

const router = Router();
const projectsController = new ProjectsController();

// All routes require authentication
router.use(authMiddleware);
router.use(checkPlatformAdmin);

// Projects CRUD
router.post('/', asyncHandler(projectsController.create));
router.get('/', asyncHandler(projectsController.list));
router.get('/:id', asyncHandler(projectsController.getById));
router.patch('/:id', asyncHandler(projectsController.update));
router.delete('/:id', asyncHandler(projectsController.delete));

export default router;
