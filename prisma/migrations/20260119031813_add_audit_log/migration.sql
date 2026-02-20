/*
  Warnings:

  - The `status` column on the `CompanyInvite` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `CompanyMemberInvite` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updatedAt` to the `PlatformAdmin` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'USED', 'EXPIRED', 'REVOKED');

-- AlterTable
ALTER TABLE "CompanyInvite" ADD COLUMN     "inviteMetadata" JSONB,
ADD COLUMN     "suggestedFounderRole" VARCHAR(50) NOT NULL DEFAULT 'OWNER',
DROP COLUMN "status",
ADD COLUMN     "status" "InviteStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "CompanyMemberInvite" DROP COLUMN "status",
ADD COLUMN     "status" "InviteStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "PlatformAdmin" ADD COLUMN     "canInviteCompanies" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "canManageAdmins" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canSuspendCompanies" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "canViewAllCompanies" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropEnum
DROP TYPE "CompanyInviteStatus";

-- DropEnum
DROP TYPE "CompanyMemberInviteStatus";

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "companyId" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity" VARCHAR(50) NOT NULL,
    "entityId" UUID,
    "metadata" JSONB,
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_companyId_idx" ON "AuditLog"("companyId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "CompanyInvite_status_idx" ON "CompanyInvite"("status");

-- CreateIndex
CREATE INDEX "CompanyMemberInvite_status_idx" ON "CompanyMemberInvite"("status");
