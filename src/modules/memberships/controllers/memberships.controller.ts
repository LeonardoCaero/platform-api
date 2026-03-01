import type { Request, Response } from 'express';
import { MembershipsService } from '../services/memberships.service';
import {
  inviteMemberSchema,
  updateRolesSchema,
  createRoleSchema,
  updateRoleSchema,
} from '../schemas/memberships.schema';

const membershipsService = new MembershipsService();

export class MembershipsController {
  // Members

  async getNonMembers(req: Request, res: Response) {
    const { id: companyId } = req.params;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const users = await membershipsService.searchNonMembers(companyId, search);
    res.json(users);
  }

  async getMembers(req: Request, res: Response) {
    const { id: companyId } = req.params;
    const members = await membershipsService.getMembers(companyId);
    res.json(members);
  }

  async inviteMember(req: Request, res: Response) {
    const { id: companyId } = req.params;
    const data = inviteMemberSchema.parse(req.body);
    const member = await membershipsService.inviteMember(companyId, data);
    res.status(201).json(member);
  }

  async updateMemberRoles(req: Request, res: Response) {
    const { id: companyId, memberId } = req.params;
    const { roleIds } = updateRolesSchema.parse(req.body);
    const member = await membershipsService.updateMemberRoles(companyId, memberId, roleIds);
    res.json(member);
  }

  async removeMember(req: Request, res: Response) {
    const { id: companyId, memberId } = req.params;
    await membershipsService.removeMember(companyId, memberId);
    res.status(204).send();
  }

  // Roles

  async getRoles(req: Request, res: Response) {
    const { id: companyId } = req.params;
    const roles = await membershipsService.getRoles(companyId);
    res.json(roles);
  }

  async createRole(req: Request, res: Response) {
    const { id: companyId } = req.params;
    const data = createRoleSchema.parse(req.body);
    const role = await membershipsService.createRole(companyId, data);
    res.status(201).json(role);
  }

  async updateRole(req: Request, res: Response) {
    const { id: companyId, roleId } = req.params;
    const data = updateRoleSchema.parse(req.body);
    const role = await membershipsService.updateRole(companyId, roleId, data);
    res.json(role);
  }

  async deleteRole(req: Request, res: Response) {
    const { id: companyId, roleId } = req.params;
    await membershipsService.deleteRole(companyId, roleId);
    res.status(204).send();
  }
}
