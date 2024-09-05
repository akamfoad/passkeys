/*
  Warnings:

  - You are about to drop the column `isAbandoned` on the `ForgetPassword` table. All the data in the column will be lost.
  - You are about to drop the column `validUntil` on the `ForgetPassword` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ForgetPassword" DROP COLUMN "isAbandoned",
DROP COLUMN "validUntil";
