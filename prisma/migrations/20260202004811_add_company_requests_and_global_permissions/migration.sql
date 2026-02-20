-- CreateEnum
CREATE TYPE "CompanyRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PermissionScope" AS ENUM ('GLOBAL', 'COMPANY');

-- AlterTable
ALTER TABLE "Permission" ADD COLUMN     "scope" "PermissionScope" NOT NULL DEFAULT 'COMPANY';

-- CreateTable
CREATE TABLE "UserGlobalPermission" (
    "userId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" UUID,

    CONSTRAINT "UserGlobalPermission_pkey" PRIMARY KEY ("userId","permissionId")
);

-- CreateTable
CREATE TABLE "CompanyRequest" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "companyName" VARCHAR(255) NOT NULL,
    "companySlug" VARCHAR(80) NOT NULL,
    "description" TEXT,
    "reason" TEXT,
    "status" "CompanyRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdCompanyId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserGlobalPermission_userId_idx" ON "UserGlobalPermission"("userId");

-- CreateIndex
CREATE INDEX "UserGlobalPermission_permissionId_idx" ON "UserGlobalPermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyRequest_createdCompanyId_key" ON "CompanyRequest"("createdCompanyId");

-- CreateIndex
CREATE INDEX "CompanyRequest_userId_idx" ON "CompanyRequest"("userId");

-- CreateIndex
CREATE INDEX "CompanyRequest_status_idx" ON "CompanyRequest"("status");

-- CreateIndex
CREATE INDEX "CompanyRequest_reviewedBy_idx" ON "CompanyRequest"("reviewedBy");

-- CreateIndex
CREATE INDEX "CompanyRequest_createdAt_idx" ON "CompanyRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "UserGlobalPermission" ADD CONSTRAINT "UserGlobalPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGlobalPermission" ADD CONSTRAINT "UserGlobalPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyRequest" ADD CONSTRAINT "CompanyRequest_createdCompanyId_fkey" FOREIGN KEY ("createdCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyRequest" ADD CONSTRAINT "CompanyRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyRequest" ADD CONSTRAINT "CompanyRequest_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
