import { z } from 'zod';

export const createTimeEntrySchema = z.object({
  companyId: z.uuid(),
  projectId: z.uuid().optional().nullable(),
  date: z.string().or(z.date()).transform(val => new Date(val)),
  hours: z.number().min(0.01),
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:mm format').optional().nullable(),
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:mm format').optional().nullable(),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(2000).optional().nullable(),
  // New fields
  isOvertime: z.boolean().optional().default(false),
  clientId: z.uuid().optional().nullable(),
  clientSiteId: z.uuid().optional().nullable(),
  categoryId: z.uuid().optional().nullable(),
  // Manager logs on behalf of another member
  targetUserId: z.uuid().optional().nullable(),
});

export const updateTimeEntrySchema = z.object({
  projectId: z.uuid().optional().nullable(),
  date: z.string().or(z.date()).transform(val => new Date(val)).optional(),
  hours: z.number().min(0.01).optional(),
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional().nullable(),
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional().nullable(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  // New fields
  isOvertime: z.boolean().optional(),
  clientId: z.uuid().optional().nullable(),
  clientSiteId: z.uuid().optional().nullable(),
  categoryId: z.uuid().optional().nullable(),
});

export const listTimeEntriesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(50),
  companyId: z.uuid().optional(),
  projectId: z.uuid().optional(),
  userId: z.uuid().optional(),
  clientId: z.uuid().optional(),
  categoryId: z.uuid().optional(),
  isOvertime: z.coerce.boolean().optional(),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

export type CreateTimeEntryDto = z.infer<typeof createTimeEntrySchema>;
export type UpdateTimeEntryDto = z.infer<typeof updateTimeEntrySchema>;
export type ListTimeEntriesQuery = z.infer<typeof listTimeEntriesQuerySchema>;

export const getSummaryQuerySchema = z.object({
  companyId: z.uuid(),
  startDate: z.string().transform(val => new Date(val)),
  endDate: z.string().transform(val => new Date(val)),
});

export type GetSummaryQuery = z.infer<typeof getSummaryQuerySchema>;
