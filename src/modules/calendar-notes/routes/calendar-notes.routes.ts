import { Router } from 'express';
import { asyncHandler } from '@/common/utils/async-handler';
import { authMiddleware } from '@/common/middlewares/auth.middleware';
import { checkPlatformAdmin } from '@/common/middlewares/platform-admin.middleware';
import { CalendarNotesController } from '../controllers/calendar-notes.controller';

const router = Router();
const calendarNotesController = new CalendarNotesController();

router.use(authMiddleware);
router.use(checkPlatformAdmin);

router.get('/upcoming-reminders', asyncHandler(calendarNotesController.getUpcomingReminderCount));
router.post('/dismiss-reminders', asyncHandler(calendarNotesController.dismissReminders));
router.post('/', asyncHandler(calendarNotesController.create));
router.get('/', asyncHandler(calendarNotesController.list));
router.get('/:id', asyncHandler(calendarNotesController.getById));
router.patch('/:id', asyncHandler(calendarNotesController.update));
router.delete('/:id', asyncHandler(calendarNotesController.delete));

export default router;
