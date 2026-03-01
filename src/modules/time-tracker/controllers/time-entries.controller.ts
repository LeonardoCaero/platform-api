import type { Request, Response } from 'express';
import { TimeEntriesService } from '../services/time-entries.service';
import {
  createTimeEntrySchema,
  updateTimeEntrySchema,
  listTimeEntriesQuerySchema,
  getSummaryQuerySchema,
} from '../schemas/time-entries.schema';

const timeEntriesService = new TimeEntriesService();

export class TimeEntriesController {
  /**
   * Create a new time entry
   */
  async create(req: Request, res: Response) {
    const userId = req.user!.userId;
    const isPlatformAdmin = req.isPlatformAdmin || false;
    const data = createTimeEntrySchema.parse(req.body);

    const timeEntry = await timeEntriesService.create(data, userId, isPlatformAdmin);

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
    const { companyId, startDate, endDate } = getSummaryQuerySchema.parse(req.query);

    const summary = await timeEntriesService.getSummary(companyId, userId, startDate, endDate);

    res.status(200).json({
      success: true,
      data: summary,
    });
  }
}
