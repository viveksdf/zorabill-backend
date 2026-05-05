-- DropForeignKey
ALTER TABLE "inventory_items" DROP CONSTRAINT "inventory_items_supplierId_fkey";

-- AlterTable
ALTER TABLE "inventory_items" ALTER COLUMN "sku" DROP NOT NULL,
ALTER COLUMN "category" DROP NOT NULL,
ALTER COLUMN "location" DROP NOT NULL,
ALTER COLUMN "hsnCode" DROP NOT NULL,
ALTER COLUMN "supplierId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
