import { z } from 'zod';

export const createCategorySchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6366F1'),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const listCategoriesQuerySchema = z.object({
  companyId: z.string().uuid(),
  isActive: z.coerce.boolean().optional(),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;
