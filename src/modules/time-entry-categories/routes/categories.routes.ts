import { Router } from 'express';
import { asyncHandler } from '@/common/utils/async-handler';
import { authMiddleware } from '@/common/middlewares/auth.middleware';
import { checkPlatformAdmin } from '@/common/middlewares/platform-admin.middleware';
import { CategoriesController } from '../controllers/categories.controller';

const router = Router();
const c = new CategoriesController();

router.use(authMiddleware);
router.use(checkPlatformAdmin);

router.get('/', asyncHandler(c.list.bind(c)));
router.post('/', asyncHandler(c.create.bind(c)));
router.patch('/:id', asyncHandler(c.update.bind(c)));
router.delete('/:id', asyncHandler(c.delete.bind(c)));

export default router;
