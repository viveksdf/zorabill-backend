/*
  Warnings:

  - You are about to drop the column `creditLimit` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `totalBilled` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `totalPaid` on the `customers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bills" ADD COLUMN     "paidAmount" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "customers" DROP COLUMN "creditLimit",
DROP COLUMN "totalBilled",
DROP COLUMN "totalPaid";
