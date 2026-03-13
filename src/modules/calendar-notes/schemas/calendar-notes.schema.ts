import { z } from 'zod';

export const createCalendarNoteSchema = z.object({
  companyId: z.string().uuid(),
  date: z.string().or(z.date()).transform(val => new Date(val)),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().max(5000).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  isPrivate: z.boolean().default(false),
  assigneeUserIds: z.array(z.string().uuid()).optional().default([]),
});

export const updateCalendarNoteSchema = z.object({
  date: z.string().or(z.date()).transform(val => new Date(val)).optional(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(5000).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  isPrivate: z.boolean().optional(),
  assigneeUserIds: z.array(z.string().uuid()).optional(),
});

export const listCalendarNotesQuerySchema = z.object({
  companyId: z.string().uuid(),
  startDate: z.string().transform(val => new Date(val)),
  endDate: z.string().transform(val => new Date(val)),
});

export type CreateCalendarNoteDto = z.infer<typeof createCalendarNoteSchema>;
export type UpdateCalendarNoteDto = z.infer<typeof updateCalendarNoteSchema>;
export type ListCalendarNotesQuery = z.infer<typeof listCalendarNotesQuerySchema>;
