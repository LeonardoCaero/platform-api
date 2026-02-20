import { Router } from 'express';
import { asyncHandler } from '@/common/utils/async-handler';
import { authMiddleware } from '@/common/middlewares/auth.middleware';
import { MembershipsController } from '../controllers/memberships.controller';

// mergeParams: true so that :id from the parent companies router is accessible
const router = Router({ mergeParams: true });
const ctrl = new MembershipsController();

router.use(authMiddleware);

// Members routes  —  /companies/:id/members
router.get('/non-members', asyncHandler(ctrl.getNonMembers));
router.get('/members', asyncHandler(ctrl.getMembers));
router.post('/members/invite', asyncHandler(ctrl.inviteMember));
router.patch('/members/:memberId/roles', asyncHandler(ctrl.updateMemberRoles));
router.delete('/members/:memberId', asyncHandler(ctrl.removeMember));

// Roles routes  —  /companies/:id/roles
router.get('/roles', asyncHandler(ctrl.getRoles));
router.post('/roles', asyncHandler(ctrl.createRole));
router.patch('/roles/:roleId', asyncHandler(ctrl.updateRole));
router.delete('/roles/:roleId', asyncHandler(ctrl.deleteRole));

export default router;
