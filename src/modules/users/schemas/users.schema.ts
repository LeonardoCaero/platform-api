import { z } from 'zod';

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(255).optional(),
  phone: z.string().max(20).optional().nullable(),
  avatar: z.string().max(500).optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8).max(100),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
