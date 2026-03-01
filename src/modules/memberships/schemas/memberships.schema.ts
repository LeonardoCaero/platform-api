import { z } from 'zod';

export const inviteMemberSchema = z.object({
  userId: z.string().uuid(),
  position: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
});

export const updateRolesSchema = z.object({
  roleIds: z.array(z.string().uuid()),
});

export const createRoleSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(255).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const updateRoleSchema = createRoleSchema.partial();

export type InviteMemberDto = z.infer<typeof inviteMemberSchema>;
export type UpdateRolesDto = z.infer<typeof updateRolesSchema>;
export type CreateRoleDto = z.infer<typeof createRoleSchema>;
export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;
