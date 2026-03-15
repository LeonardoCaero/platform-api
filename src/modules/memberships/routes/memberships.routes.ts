import { Router } from 'express';
import { asyncHandler } from '@/common/utils/async-handler';
import { authMiddleware } from '@/common/middlewares/auth.middleware';
import { checkCompanyPermission } from '@/common/middlewares/check-company-permission.middleware';
import { MembershipsController } from '../controllers/memberships.controller';

const router = Router({ mergeParams: true });
const ctrl = new MembershipsController();

router.use(authMiddleware);

// Members routes  —  /companies/:id/members
router.get('/non-members', asyncHandler(ctrl.getNonMembers));
router.get('/members', asyncHandler(ctrl.getMembers));
router.post('/members/invite', checkCompanyPermission('MEMBER:INVITE'), asyncHandler(ctrl.inviteMember));
router.patch('/members/:memberId/roles', checkCompanyPermission('MEMBER:EDIT_ROLE'), asyncHandler(ctrl.updateMemberRoles));
router.delete('/members/:memberId', checkCompanyPermission('MEMBER:REMOVE'), asyncHandler(ctrl.removeMember));

// Roles routes  —  /companies/:id/roles
router.get('/roles', asyncHandler(ctrl.getRoles));
router.post('/roles', checkCompanyPermission('ROLE:CREATE'), asyncHandler(ctrl.createRole));
router.patch('/roles/:roleId', checkCompanyPermission('ROLE:EDIT'), asyncHandler(ctrl.updateRole));
router.delete('/roles/:roleId', checkCompanyPermission('ROLE:DELETE'), asyncHandler(ctrl.deleteRole));

export default router;
