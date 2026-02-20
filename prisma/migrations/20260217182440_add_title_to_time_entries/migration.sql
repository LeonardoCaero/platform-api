/*
  Warnings:

  - Added the required column `title` to the `TimeEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TimeEntry" ADD COLUMN     "title" VARCHAR(200) NOT NULL;
