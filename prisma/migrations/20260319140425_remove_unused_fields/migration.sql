-- DropForeignKey
ALTER TABLE "CompanyInvite" DROP CONSTRAINT "CompanyInvite_createdCompanyId_fkey";

-- DropForeignKey
ALTER TABLE "CompanyInvite" DROP CONSTRAINT "CompanyInvite_issuedByAdminId_fkey";

-- DropForeignKey
ALTER TABLE "CompanyInvite" DROP CONSTRAINT "CompanyInvite_usedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "Membership" DROP CONSTRAINT "Membership_supervisorMembershipId_fkey";

-- DropIndex
DROP INDEX "User_email_emailVerified_idx";

-- AlterTable
ALTER TABLE "Membership" DROP COLUMN "hourlyRate",
DROP COLUMN "metadata",
DROP COLUMN "supervisorMembershipId";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailVerified",
DROP COLUMN "emailVerifiedAt";

-- DropTable
DROP TABLE "CompanyInvite";

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");
