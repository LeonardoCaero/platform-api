-- AlterTable
ALTER TABLE "CalendarNote" ADD COLUMN     "reminderDaysBefore" INTEGER[] DEFAULT ARRAY[]::INTEGER[];

-- CreateTable
CREATE TABLE "ReminderNotification" (
    "id" UUID NOT NULL,
    "calendarNoteId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "scheduledFor" DATE NOT NULL,
    "daysBeforeDue" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReminderNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReminderNotification_scheduledFor_sentAt_idx" ON "ReminderNotification"("scheduledFor", "sentAt");

-- CreateIndex
CREATE INDEX "ReminderNotification_userId_idx" ON "ReminderNotification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReminderNotification_calendarNoteId_userId_daysBeforeDue_key" ON "ReminderNotification"("calendarNoteId", "userId", "daysBeforeDue");

-- AddForeignKey
ALTER TABLE "ReminderNotification" ADD CONSTRAINT "ReminderNotification_calendarNoteId_fkey" FOREIGN KEY ("calendarNoteId") REFERENCES "CalendarNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderNotification" ADD CONSTRAINT "ReminderNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
