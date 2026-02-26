-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ClientSite" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false;
