import type { Request, Response } from 'express';
import { z } from 'zod';
import { TimeEntriesService } from '../services/time-entries.service';
import {
  createTimeEntrySchema,
  updateTimeEntrySchema,
  listTimeEntriesQuerySchema,
} from '../schemas/time-entries.schema';
import { prisma } from '@/db/prisma';

const timeEntriesService = new TimeEntriesService();

export class TimeEntriesController {
  /**
   * Create a new time entry
   */
  async create(req: Request, res: Response) {
    const userId = req.user!.userId;
    const data = createTimeEntrySchema.parse(req.body);

    const timeEntry = await timeEntriesService.create(data, userId);

    res.status(201).json({
      success: true,
      data: timeEntry,
    });
  }

  /**
   * List time entries with filters
   */
  async list(req: Request, res: Response) {
    const userId = req.user!.userId;
    const isPlatformAdmin = req.isPlatformAdmin || false;
    const query = listTimeEntriesQuerySchema.parse(req.query);

    // Non-admin users can only see their own entries unless they are an Owner of the company
    if (!isPlatformAdmin && query.companyId) {
      const isOwner = await prisma.membership.findFirst({
        where: {
          userId,
          companyId: query.companyId,
          status: 'ACTIVE',
          roles: {
            some: {
              role: { name: 'Owner' },
            },
          },
        },
      });

      if (!isOwner) {
        // Force filter to own entries only
        query.userId = userId;
      }
    } else if (!isPlatformAdmin) {
      // No companyId provided, restrict to own entries
      query.userId = userId;
    }

    const result = await timeEntriesService.list(query, userId, isPlatformAdmin);

    res.status(200).json({
      success: true,
      data: result.timeEntries,
      pagination: result.pagination,
    });
  }

  /**
   * Get time entry by ID
   */
  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const isPlatformAdmin = req.isPlatformAdmin || false;

    const timeEntry = await timeEntriesService.getById(id, userId, isPlatformAdmin);

    res.status(200).json({
      success: true,
      data: timeEntry,
    });
  }

  /**
   * Update time entry
   */
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const isPlatformAdmin = req.isPlatformAdmin || false;
    const data = updateTimeEntrySchema.parse(req.body);

    const timeEntry = await timeEntriesService.update(id, data, userId, isPlatformAdmin);

    res.status(200).json({
      success: true,
      data: timeEntry,
    });
  }

  /**
   * Delete time entry
   */
  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const isPlatformAdmin = req.isPlatformAdmin || false;

    const result = await timeEntriesService.delete(id, userId, isPlatformAdmin);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  }

  /**
   * Get time summary for current user
   */
  async getSummary(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { companyId, startDate, endDate } = z.object({
      companyId: z.string().uuid(),
      startDate: z.string().transform(val => new Date(val)),
      endDate: z.string().transform(val => new Date(val)),
    }).parse(req.query);

    const summary = await timeEntriesService.getSummary(companyId, userId, startDate, endDate);

    res.status(200).json({
      success: true,
      data: summary,
    });
  }
}
