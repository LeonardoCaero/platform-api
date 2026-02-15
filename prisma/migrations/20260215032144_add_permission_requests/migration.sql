/*
  Warnings:

  - You are about to drop the column `permissionId` on the `PermissionRequest` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PermissionRequestType" AS ENUM ('GLOBAL_PERMISSION', 'OTHER');

-- DropForeignKey
ALTER TABLE "PermissionRequest" DROP CONSTRAINT "PermissionRequest_permissionId_fkey";

-- DropIndex
DROP INDEX "PermissionRequest_permissionId_idx";

-- DropIndex
DROP INDEX "PermissionRequest_userId_permissionId_status_key";

-- AlterTable
ALTER TABLE "PermissionRequest" DROP COLUMN "permissionId",
ADD COLUMN     "requestedPermissionId" UUID,
ADD COLUMN     "type" "PermissionRequestType" NOT NULL DEFAULT 'GLOBAL_PERMISSION';

-- CreateIndex
CREATE INDEX "PermissionRequest_type_idx" ON "PermissionRequest"("type");

-- AddForeignKey
ALTER TABLE "PermissionRequest" ADD CONSTRAINT "PermissionRequest_requestedPermissionId_fkey" FOREIGN KEY ("requestedPermissionId") REFERENCES "Permission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
