import { z } from 'zod';
import { PermissionScope } from '@prisma/client';

export const createPermissionSchema = z.object({
  key: z.string().min(2).max(120).regex(/^[A-Z_]+:[A-Z_]+$/, 'Key must follow format RESOURCE:ACTION (e.g., COMPANY:CREATE)'),
  description: z.string().min(2).max(255).optional().nullable(),
  scope: z.nativeEnum(PermissionScope).default(PermissionScope.COMPANY),
});

export const updatePermissionSchema = z.object({
  key: z.string().min(2).max(120).regex(/^[A-Z_]+:[A-Z_]+$/, 'Key must follow format RESOURCE:ACTION').optional(),
  description: z.string().min(2).max(255).optional().nullable(),
  scope: z.nativeEnum(PermissionScope).optional(),
});

export const listPermissionsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  scope: z.nativeEnum(PermissionScope).optional(),
});

export type CreatePermissionDto = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionDto = z.infer<typeof updatePermissionSchema>;
export type ListPermissionsQuery = z.infer<typeof listPermissionsQuerySchema>;
