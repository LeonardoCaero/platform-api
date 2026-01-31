import { z } from 'zod';
import { CompanyStatus } from '@prisma/client';

export const createCompanySchema = z.object({
  name: z.string().min(2).max(255),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  logo: z.string().max(500).url().optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const updateCompanySchema = z.object({
  name: z.string().min(2).max(255).optional(),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/).optional(),
  logo: z.string().max(500).url().optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional(),
  status: z.enum(CompanyStatus).optional(),
});

export const listCompaniesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(CompanyStatus).optional(),
  includeDeleted: z.coerce.boolean().default(false),
});

export type CreateCompanyDto = z.infer<typeof createCompanySchema>;
export type UpdateCompanyDto = z.infer<typeof updateCompanySchema>;
export type ListCompaniesQuery = z.infer<typeof listCompaniesQuerySchema>;
