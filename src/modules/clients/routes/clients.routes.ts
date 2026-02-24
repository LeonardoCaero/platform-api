import { Router } from 'express';
import { asyncHandler } from '@/common/utils/async-handler';
import { authMiddleware } from '@/common/middlewares/auth.middleware';
import { checkPlatformAdmin } from '@/common/middlewares/platform-admin.middleware';
import { ClientsController } from '../controllers/clients.controller';

const router = Router();
const c = new ClientsController();

router.use(authMiddleware);
router.use(checkPlatformAdmin);

// Clients CRUD
router.get('/', asyncHandler(c.list.bind(c)));
router.post('/', asyncHandler(c.create.bind(c)));
router.get('/:id', asyncHandler(c.getById.bind(c)));
router.patch('/:id', asyncHandler(c.update.bind(c)));
router.delete('/:id', asyncHandler(c.delete.bind(c)));

// Sites (nested under client)
router.post('/:clientId/sites', asyncHandler(c.createSite.bind(c)));
router.patch('/sites/:siteId', asyncHandler(c.updateSite.bind(c)));
router.delete('/sites/:siteId', asyncHandler(c.deleteSite.bind(c)));

// Rate rules (nested under client)
router.post('/:clientId/rates', asyncHandler(c.createRateRule.bind(c)));
router.patch('/rates/:ruleId', asyncHandler(c.updateRateRule.bind(c)));
router.delete('/rates/:ruleId', asyncHandler(c.deleteRateRule.bind(c)));

// Resources (nested under rate rule)
router.post('/rates/:ruleId/resources', asyncHandler(c.createResource.bind(c)));
router.patch('/resources/:resourceId', asyncHandler(c.updateResource.bind(c)));
router.delete('/resources/:resourceId', asyncHandler(c.deleteResource.bind(c)));

export default router;
