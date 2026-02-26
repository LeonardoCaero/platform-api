import { z } from 'zod';

// ─── Client ──────────────────────────────────────────────────────────────────

export const createClientSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(1).max(255),
  taxId: z.string().max(50).optional().nullable(),
  email: z.string().email().max(320).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(1000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateClientSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  taxId: z.string().max(50).optional().nullable(),
  email: z.string().email().max(320).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(1000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

export const listClientsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(200).default(50),
  companyId: z.string().uuid(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

// ─── Client Site ─────────────────────────────────────────────────────────────

export const createClientSiteSchema = z.object({
  name: z.string().min(1).max(255),
  address: z.string().max(1000).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateClientSiteSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  address: z.string().max(1000).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

// ─── Client Rate Rule ────────────────────────────────────────────────────────

const overtimeTriggerSchema = z.enum(['WEEKEND', 'AFTER_HOURS', 'MANUAL']);

export const createClientRateRuleSchema = z.object({
  name: z.string().min(1).max(100),
  baseRatePerHour: z.number().min(0).optional().nullable(),
  overtimeRatePerHour: z.number().min(0),
  currency: z.string().length(3).default('EUR'),
  overtimeTriggers: z.array(overtimeTriggerSchema).default([]),
  workdayStartTime: z.string().transform(v => v === '' ? null : v).pipe(z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).nullable()).optional().nullable(),
  workdayEndTime: z.string().transform(v => v === '' ? null : v).pipe(z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).nullable()).optional().nullable(),
  workdays: z.array(z.number().int().min(0).max(6)).default([1,2,3,4,5]),
  isActive: z.boolean().default(true),
  effectiveFrom: z.string().or(z.date()).transform(v => new Date(v)),
  effectiveTo: z.string().or(z.date()).transform(v => new Date(v)).optional().nullable(),
});

export const updateClientRateRuleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  baseRatePerHour: z.number().min(0).optional().nullable(),
  overtimeRatePerHour: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  overtimeTriggers: z.array(overtimeTriggerSchema).optional(),
  workdayStartTime: z.string().transform(v => v === '' ? null : v).pipe(z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).nullable()).optional().nullable(),
  workdayEndTime: z.string().transform(v => v === '' ? null : v).pipe(z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).nullable()).optional().nullable(),
  workdays: z.array(z.number().int().min(0).max(6)).optional(),
  isActive: z.boolean().optional(),
  effectiveFrom: z.string().or(z.date()).transform(v => new Date(v)).optional(),
  effectiveTo: z.string().or(z.date()).transform(v => new Date(v)).optional().nullable(),
});

// ─── Client Rate Rule Resource ──────────────────────────────────────────────

export const createClientRateRuleResourceSchema = z.object({
  name: z.string().min(1).max(100),
  baseRatePerHour: z.number().min(0),
  isActive: z.boolean().default(true),
});

export const updateClientRateRuleResourceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  baseRatePerHour: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type CreateClientDto = z.infer<typeof createClientSchema>;
export type UpdateClientDto = z.infer<typeof updateClientSchema>;
export type ListClientsQuery = z.infer<typeof listClientsQuerySchema>;
export type CreateClientSiteDto = z.infer<typeof createClientSiteSchema>;
export type UpdateClientSiteDto = z.infer<typeof updateClientSiteSchema>;
export type CreateClientRateRuleDto = z.infer<typeof createClientRateRuleSchema>;
export type UpdateClientRateRuleDto = z.infer<typeof updateClientRateRuleSchema>;
export type CreateClientRateRuleResourceDto = z.infer<typeof createClientRateRuleResourceSchema>;
export type UpdateClientRateRuleResourceDto = z.infer<typeof updateClientRateRuleResourceSchema>;
