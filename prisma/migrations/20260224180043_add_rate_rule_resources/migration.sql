-- AlterTable
ALTER TABLE "ClientRateRule" ALTER COLUMN "baseRatePerHour" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ClientRateRuleResource" (
    "id" UUID NOT NULL,
    "rateRuleId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "baseRatePerHour" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientRateRuleResource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientRateRuleResource_rateRuleId_idx" ON "ClientRateRuleResource"("rateRuleId");

-- AddForeignKey
ALTER TABLE "ClientRateRuleResource" ADD CONSTRAINT "ClientRateRuleResource_rateRuleId_fkey" FOREIGN KEY ("rateRuleId") REFERENCES "ClientRateRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
