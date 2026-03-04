-- CreateTable
CREATE TABLE "CalendarNote" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT,
    "color" VARCHAR(7) DEFAULT '#6366F1',
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarNoteAssignee" (
    "id" UUID NOT NULL,
    "calendarNoteId" UUID NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "CalendarNoteAssignee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalendarNote_companyId_date_idx" ON "CalendarNote"("companyId", "date");

-- CreateIndex
CREATE INDEX "CalendarNote_createdByUserId_idx" ON "CalendarNote"("createdByUserId");

-- CreateIndex
CREATE INDEX "CalendarNoteAssignee_userId_idx" ON "CalendarNoteAssignee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarNoteAssignee_calendarNoteId_userId_key" ON "CalendarNoteAssignee"("calendarNoteId", "userId");

-- AddForeignKey
ALTER TABLE "CalendarNote" ADD CONSTRAINT "CalendarNote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarNote" ADD CONSTRAINT "CalendarNote_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarNoteAssignee" ADD CONSTRAINT "CalendarNoteAssignee_calendarNoteId_fkey" FOREIGN KEY ("calendarNoteId") REFERENCES "CalendarNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarNoteAssignee" ADD CONSTRAINT "CalendarNoteAssignee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
