-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_loggedByUserId_fkey" FOREIGN KEY ("loggedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
