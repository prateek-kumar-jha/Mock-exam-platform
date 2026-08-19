/*
  Warnings:

  - You are about to drop the `Resource` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_exam_id_fkey";

-- DropTable
DROP TABLE "Resource";

-- DropEnum
DROP TYPE "AccessTier";
