/*
  Warnings:

  - A unique constraint covering the columns `[companyId,email,status]` on the table `CompanyMemberInvite` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CompanyMemberInvite" ADD COLUMN     "inviteMessage" TEXT;

-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "department" VARCHAR(100),
ADD COLUMN     "position" VARCHAR(100);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyMemberInvite_companyId_email_status_key" ON "CompanyMemberInvite"("companyId", "email", "status");
