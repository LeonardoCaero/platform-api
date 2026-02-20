import { z } from 'zod';
import { CompanyRequestStatus } from '@prisma/client';

// Create company request
export const createCompanyRequestSchema = z.object({
  companyName: z.string().min(2).max(255),
  companySlug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  reason: z.string().optional(),
});

export type CreateCompanyRequestDto = z.infer<typeof createCompanyRequestSchema>;

// Update company request (user can update their pending request)
export const updateCompanyRequestSchema = z.object({
  companyName: z.string().min(2).max(255).optional(),
  companySlug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional(),
  reason: z.string().optional(),
});

export type UpdateCompanyRequestDto = z.infer<typeof updateCompanyRequestSchema>;

// Admin review
export const reviewCompanyRequestSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reviewNotes: z.string().optional(),
});

export type ReviewCompanyRequestDto = z.infer<typeof reviewCompanyRequestSchema>;

// List filters
export const listCompanyRequestsSchema = z.object({
  status: z.nativeEnum(CompanyRequestStatus).optional(),
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(10).optional(),
});

export type ListCompanyRequestsDto = z.infer<typeof listCompanyRequestsSchema>;
