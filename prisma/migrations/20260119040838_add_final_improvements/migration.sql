/*
  Warnings:

  - You are about to drop the column `inviteMetadata` on the `CompanyInvite` table. All the data in the column will be lost.
  - You are about to drop the column `suggestedFounderRole` on the `CompanyInvite` table. All the data in the column will be lost.
  - You are about to drop the column `canInviteCompanies` on the `PlatformAdmin` table. All the data in the column will be lost.
  - You are about to drop the column `canManageAdmins` on the `PlatformAdmin` table. All the data in the column will be lost.
  - You are about to drop the column `canSuspendCompanies` on the `PlatformAdmin` table. All the data in the column will be lost.
  - You are about to drop the column `canViewAllCompanies` on the `PlatformAdmin` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `PlatformAdmin` table. All the data in the column will be lost.
  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "description" TEXT,
ADD COLUMN     "logo" VARCHAR(500),
ADD COLUMN     "metadata" JSONB DEFAULT '{}';

-- AlterTable
ALTER TABLE "CompanyInvite" DROP COLUMN "inviteMetadata",
DROP COLUMN "suggestedFounderRole";

-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB DEFAULT '{}';

-- AlterTable
ALTER TABLE "PlatformAdmin" DROP COLUMN "canInviteCompanies",
DROP COLUMN "canManageAdmins",
DROP COLUMN "canSuspendCompanies",
DROP COLUMN "canViewAllCompanies",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "color" VARCHAR(7) DEFAULT '#6366F1',
ADD COLUMN     "description" VARCHAR(255);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar" VARCHAR(500),
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "phone" VARCHAR(20);

-- DropTable
DROP TABLE "AuditLog";

-- CreateIndex
CREATE INDEX "CompanyMemberInvite_companyId_status_idx" ON "CompanyMemberInvite"("companyId", "status");

-- CreateIndex
CREATE INDEX "Membership_expiresAt_idx" ON "Membership"("expiresAt");

-- CreateIndex
CREATE INDEX "User_email_emailVerified_idx" ON "User"("email", "emailVerified");
