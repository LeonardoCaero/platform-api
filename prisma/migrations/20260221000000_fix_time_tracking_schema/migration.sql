-- Fix TimeEntry table: remove columns that were removed from schema
-- and fix description nullability

-- Drop FK and index for membershipId (NOT NULL violation cause)
ALTER TABLE "TimeEntry" DROP CONSTRAINT IF EXISTS "TimeEntry_membershipId_fkey";
DROP INDEX IF EXISTS "TimeEntry_membershipId_date_idx";
DROP INDEX IF EXISTS "TimeEntry_status_idx";

ALTER TABLE "TimeEntry" DROP COLUMN IF EXISTS "membershipId";
ALTER TABLE "TimeEntry" DROP COLUMN IF EXISTS "billable";
ALTER TABLE "TimeEntry" DROP COLUMN IF EXISTS "status";

-- Make description nullable (was NOT NULL in original migration)
ALTER TABLE "TimeEntry" ALTER COLUMN "description" DROP NOT NULL;

-- Fix Project table: remove columns removed from schema
ALTER TABLE "Project" DROP CONSTRAINT IF EXISTS "Project_companyId_code_key";
DROP INDEX IF EXISTS "Project_companyId_code_key";

ALTER TABLE "Project" DROP COLUMN IF EXISTS "code";
ALTER TABLE "Project" DROP COLUMN IF EXISTS "startDate";
ALTER TABLE "Project" DROP COLUMN IF EXISTS "endDate";

-- Drop the enum that was removed from schema
DROP TYPE IF EXISTS "TimeEntryStatus";
