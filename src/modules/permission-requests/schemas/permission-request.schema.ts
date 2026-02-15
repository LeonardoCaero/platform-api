import { z } from 'zod';

// Enums
export const PermissionRequestType = z.enum(['GLOBAL_PERMISSION', 'OTHER']);
export const PermissionRequestStatus = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']);

// Create permission request
export const createPermissionRequestSchema = z.object({
  type: PermissionRequestType.default('GLOBAL_PERMISSION'),
  requestedPermissionId: z.string().uuid().optional(),
  reason: z.string().max(1000).optional(),
});

export type CreatePermissionRequestDto = z.infer<typeof createPermissionRequestSchema>;

// Update permission request
export const updatePermissionRequestSchema = z.object({
  reason: z.string().max(1000).optional(),
});

export type UpdatePermissionRequestDto = z.infer<typeof updatePermissionRequestSchema>;

// List permission requests query params
export const listPermissionRequestsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.preprocess(
    (val) => (val === 'ALL' || val === 'all' || val === '' ? undefined : val),
    PermissionRequestStatus.optional()
  ),
  type: z.preprocess(
    (val) => (val === 'ALL' || val === 'all' || val === '' ? undefined : val),
    PermissionRequestType.optional()
  ),
});

export type ListPermissionRequestsDto = z.infer<typeof listPermissionRequestsSchema>;

// Review permission request (admin action)
export const reviewPermissionRequestSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reviewNotes: z.string().max(1000).optional(),
});

export type ReviewPermissionRequestDto = z.infer<typeof reviewPermissionRequestSchema>;
