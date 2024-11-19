/*
  Warnings:

  - Added the required column `reportedById` to the `Report` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "reportedById" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Report_reportedById_idx" ON "Report"("reportedById");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
