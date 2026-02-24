-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('EMPLOYEE', 'FREELANCE', 'INTERN', 'CONTRACTOR', 'OTHER');

-- CreateEnum
CREATE TYPE "OvertimeTrigger" AS ENUM ('WEEKEND', 'AFTER_HOURS', 'MANUAL');

-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "contractType" "ContractType" NOT NULL DEFAULT 'EMPLOYEE',
ADD COLUMN     "hourlyRate" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "TimeEntry" ADD COLUMN     "appliedRatePerHour" DECIMAL(10,2),
ADD COLUMN     "categoryId" UUID,
ADD COLUMN     "clientId" UUID,
ADD COLUMN     "clientSiteId" UUID,
ADD COLUMN     "isOvertime" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "loggedByUserId" UUID;

-- CreateTable
CREATE TABLE "Client" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "taxId" VARCHAR(50),
    "email" VARCHAR(320),
    "phone" VARCHAR(20),
    "address" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientSite" (
    "id" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" TEXT,
    "city" VARCHAR(100),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientRateRule" (
    "id" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "baseRatePerHour" DECIMAL(10,2) NOT NULL,
    "overtimeRatePerHour" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'EUR',
    "overtimeTriggers" "OvertimeTrigger"[],
    "workdayStartTime" VARCHAR(5),
    "workdayEndTime" VARCHAR(5),
    "workdays" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,

    CONSTRAINT "ClientRateRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeEntryCategory" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "color" VARCHAR(7) DEFAULT '#6366F1',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,

    CONSTRAINT "TimeEntryCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Client_companyId_isActive_idx" ON "Client"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "Client_companyId_idx" ON "Client"("companyId");

-- CreateIndex
CREATE INDEX "ClientSite_clientId_isActive_idx" ON "ClientSite"("clientId", "isActive");

-- CreateIndex
CREATE INDEX "ClientRateRule_clientId_isActive_idx" ON "ClientRateRule"("clientId", "isActive");

-- CreateIndex
CREATE INDEX "ClientRateRule_effectiveFrom_idx" ON "ClientRateRule"("effectiveFrom");

-- CreateIndex
CREATE INDEX "TimeEntryCategory_companyId_isActive_idx" ON "TimeEntryCategory"("companyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TimeEntryCategory_companyId_name_key" ON "TimeEntryCategory"("companyId", "name");

-- CreateIndex
CREATE INDEX "TimeEntry_clientId_idx" ON "TimeEntry"("clientId");

-- CreateIndex
CREATE INDEX "TimeEntry_isOvertime_idx" ON "TimeEntry"("isOvertime");

-- CreateIndex
CREATE INDEX "TimeEntry_loggedByUserId_idx" ON "TimeEntry"("loggedByUserId");

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_clientSiteId_fkey" FOREIGN KEY ("clientSiteId") REFERENCES "ClientSite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TimeEntryCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientSite" ADD CONSTRAINT "ClientSite_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientRateRule" ADD CONSTRAINT "ClientRateRule_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntryCategory" ADD CONSTRAINT "TimeEntryCategory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
