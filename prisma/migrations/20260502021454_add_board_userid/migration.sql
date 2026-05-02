/*
  Warnings:

  - You are about to alter the column `name` on the `boards` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.

*/
-- AlterTable
ALTER TABLE "boards" ADD COLUMN     "userId" TEXT,
ALTER COLUMN "name" SET DATA TYPE VARCHAR(100);
