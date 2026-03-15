/**
 * Reminder scheduler - runs daily at 08:00 (server local time).
 * For every pending ReminderNotification whose scheduledFor <= today,
 * it sends a push notification to the user and marks it as sent.
 */
import cron from 'node-cron';
import { prisma } from './db/prisma';
import { pushService } from './modules/push-subscriptions/services/push-subscriptions.service';
import { t } from './modules/push-subscriptions/push.i18n';
import { logger } from './common/logger/logger';

async function fireReminderNotifications() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const pending = await prisma.reminderNotification.findMany({
    where: {
      sentAt: null,
      scheduledFor: { lte: today },
    },
    include: {
      calendarNote: { select: { title: true, date: true } },
    },
    orderBy: { scheduledFor: 'asc' },
  });

  if (pending.length === 0) return;

  logger.info(`[Scheduler] Firing ${pending.length} reminder notification(s)`);

  const now = new Date();

  const sends = pending.map(async (reminder) => {
    const { calendarNote, userId, daysBeforeDue } = reminder;
    try {
      await pushService.sendToUser(userId, (lang) =>
        t(lang).reminderDue(calendarNote.title, calendarNote.date, daysBeforeDue),
      );
      await prisma.reminderNotification.update({
        where: { id: reminder.id },
        data: { sentAt: now },
      });
    } catch (err) {
      logger.error(`[Scheduler] Failed to send reminder ${reminder.id}`, err);
    }
  });

  await Promise.allSettled(sends);
}

async function cleanupExpiredTokens() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [refreshTokens, memberInvites] = await Promise.all([
    prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: thirtyDaysAgo } },
          { revokedAt: { lt: thirtyDaysAgo } },
        ],
      },
    }),
    prisma.companyMemberInvite.deleteMany({
      where: {
        status: { in: ['USED', 'EXPIRED', 'REVOKED'] },
        updatedAt: { lt: thirtyDaysAgo },
      },
    }),
  ]);

  logger.info(`[Scheduler] Token cleanup: removed ${refreshTokens.count} refresh tokens, ${memberInvites.count} old invites`);
}

export function startScheduler() {
  // Run every day at 08:00 UTC
  cron.schedule('0 8 * * *', () => {
    fireReminderNotifications().catch((err) =>
      logger.error('[Scheduler] Unhandled error in reminder job', err),
    );
  }, { timezone: 'UTC' });

  // Run every day at 03:00 UTC — clean up expired/revoked tokens older than 30 days
  cron.schedule('0 3 * * *', () => {
    cleanupExpiredTokens().catch((err) =>
      logger.error('[Scheduler] Unhandled error in token cleanup job', err),
    );
  }, { timezone: 'UTC' });

  logger.info('[Scheduler] Jobs scheduled (reminders at 08:00 UTC, cleanup at 03:00 UTC)');
}
