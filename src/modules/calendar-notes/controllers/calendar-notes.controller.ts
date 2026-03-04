import type { Request, Response } from 'express';
import { CalendarNotesService } from '../services/calendar-notes.service';
import {
  createCalendarNoteSchema,
  updateCalendarNoteSchema,
  listCalendarNotesQuerySchema,
} from '../schemas/calendar-notes.schema';

const calendarNotesService = new CalendarNotesService();

export class CalendarNotesController {
  async create(req: Request, res: Response) {
    const userId = req.user!.userId;
    const isPlatformAdmin = req.isPlatformAdmin || false;
    const data = createCalendarNoteSchema.parse(req.body);

    const note = await calendarNotesService.create(data, userId, isPlatformAdmin);
    res.status(201).json({ success: true, data: note });
  }

  async list(req: Request, res: Response) {
    const userId = req.user!.userId;
    const isPlatformAdmin = req.isPlatformAdmin || false;
    const query = listCalendarNotesQuerySchema.parse(req.query);

    const notes = await calendarNotesService.list(query, userId, isPlatformAdmin);
    res.status(200).json({ success: true, data: notes });
  }

  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const isPlatformAdmin = req.isPlatformAdmin || false;

    const note = await calendarNotesService.getById(id, userId, isPlatformAdmin);
    res.status(200).json({ success: true, data: note });
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const isPlatformAdmin = req.isPlatformAdmin || false;
    const data = updateCalendarNoteSchema.parse(req.body);

    const note = await calendarNotesService.update(id, data, userId, isPlatformAdmin);
    res.status(200).json({ success: true, data: note });
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const isPlatformAdmin = req.isPlatformAdmin || false;

    const result = await calendarNotesService.delete(id, userId, isPlatformAdmin);
    res.status(200).json({ success: true, message: result.message });
  }
}
