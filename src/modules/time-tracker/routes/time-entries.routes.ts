import { Router } from 'express';
import { asyncHandler } from '@/common/utils/async-handler';
import { authMiddleware } from '@/common/middlewares/auth.middleware';
import { checkPlatformAdmin } from '@/common/middlewares/platform-admin.middleware';
import { TimeEntriesController } from '../controllers/time-entries.controller';

const router = Router();
const timeEntriesController = new TimeEntriesController();

// All routes require authentication
router.use(authMiddleware);
router.use(checkPlatformAdmin);

// Time entries CRUD
router.post('/', asyncHandler(timeEntriesController.create));
router.get('/', asyncHandler(timeEntriesController.list));
router.get('/summary', asyncHandler(timeEntriesController.getSummary));
router.get('/:id', asyncHandler(timeEntriesController.getById));
router.patch('/:id', asyncHandler(timeEntriesController.update));
router.delete('/:id', asyncHandler(timeEntriesController.delete));

export default router;
