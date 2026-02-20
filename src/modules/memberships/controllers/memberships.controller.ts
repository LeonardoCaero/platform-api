import type { Request, Response } from 'express';
import { z } from 'zod';
import { MembershipsService } from '../services/memberships.service';

const membershipsService = new MembershipsService();

const inviteMemberSchema = z.object({
  userId: z.string().uuid(),
  position: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
});

const updateRolesSchema = z.object({
  roleIds: z.array(z.string().uuid()),
});

const createRoleSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(255).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

const updateRoleSchema = createRoleSchema.partial();

export class MembershipsController {
  // ─── Members ──────────────────────────────────────────────────────────────

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

  // ─── Roles ─────────────────────────────────────────────────────────────────

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
