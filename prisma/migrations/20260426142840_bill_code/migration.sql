/*
  Warnings:

  - A unique constraint covering the columns `[billCode]` on the table `bills` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `billCode` to the `bills` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bills" ADD COLUMN     "billCode" VARCHAR(10) NOT NULL;

-- AlterTable
ALTER TABLE "customers" ALTER COLUMN "phone" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "bills_billCode_key" ON "bills"("billCode");
