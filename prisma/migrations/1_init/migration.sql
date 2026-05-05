-- CreateTable CreateCustomers
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20) NOT NULL UNIQUE,
    "email" VARCHAR(255) UNIQUE,
    "address" TEXT,
    "gstNumber" VARCHAR(50) UNIQUE,
    "panNumber" VARCHAR(20) UNIQUE,
    "creditLimit" INTEGER,
    "totalBilled" BIGINT NOT NULL DEFAULT 0,
    "totalPaid" BIGINT NOT NULL DEFAULT 0,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "customers_status_idx" ON "customers"("status");
CREATE INDEX "customers_createdAt_idx" ON "customers"("createdAt");

-- CreateTable CreateSuppliers
CREATE TABLE "suppliers" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "contactPerson" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255),
    "address" TEXT NOT NULL,
    "gstNumber" VARCHAR(50) UNIQUE,
    "panNumber" VARCHAR(20) UNIQUE,
    "paymentTerms" VARCHAR(100) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "suppliers_status_idx" ON "suppliers"("status");
CREATE INDEX "suppliers_createdAt_idx" ON "suppliers"("createdAt");

-- CreateTable CreateInventoryItems
CREATE TABLE "inventory_items" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "sku" VARCHAR(100) NOT NULL UNIQUE,
    "category" VARCHAR(100) NOT NULL,
    "location" VARCHAR(100) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "purchasePrice" BIGINT NOT NULL,
    "sellingPrice" BIGINT NOT NULL,
    "currentQuantity" INTEGER NOT NULL,
    "totalQuantity" INTEGER NOT NULL,
    "lowStockThreshold" INTEGER NOT NULL,
    "taxRate" INTEGER NOT NULL,
    "hsnCode" VARCHAR(20) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "supplierId" INTEGER NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "inventory_items_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "inventory_items_sku_idx" ON "inventory_items"("sku");
CREATE INDEX "inventory_items_category_idx" ON "inventory_items"("category");
CREATE INDEX "inventory_items_supplierId_idx" ON "inventory_items"("supplierId");
CREATE INDEX "inventory_items_status_idx" ON "inventory_items"("status");
CREATE INDEX "inventory_items_expiryDate_idx" ON "inventory_items"("expiryDate");

-- CreateTable CreateBills
CREATE TABLE "bills" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "billNumber" VARCHAR(50) NOT NULL UNIQUE,
    "customerId" INTEGER NOT NULL,
    "customerName" VARCHAR(255) NOT NULL,
    "subtotal" BIGINT NOT NULL,
    "discountAmount" BIGINT NOT NULL DEFAULT 0,
    "taxAmount" BIGINT NOT NULL,
    "totalAmount" BIGINT NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'unpaid',
    "notes" TEXT,
    "dueDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bills_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "bills_billNumber_idx" ON "bills"("billNumber");
CREATE INDEX "bills_customerId_idx" ON "bills"("customerId");
CREATE INDEX "bills_status_idx" ON "bills"("status");
CREATE INDEX "bills_createdAt_idx" ON "bills"("createdAt");

-- CreateTable CreateBillItems
CREATE TABLE "bill_items" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "billId" INTEGER NOT NULL,
    "inventoryItemId" INTEGER NOT NULL,
    "itemName" VARCHAR(255) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" BIGINT NOT NULL,
    "discount" INTEGER NOT NULL,
    "taxRate" INTEGER NOT NULL,
    "subtotal" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bill_items_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bills" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bill_items_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "bill_items_billId_idx" ON "bill_items"("billId");
CREATE INDEX "bill_items_inventoryItemId_idx" ON "bill_items"("inventoryItemId");

-- CreateTable CreatePurchaseOrders
CREATE TABLE "purchase_orders" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "poNumber" VARCHAR(50) NOT NULL UNIQUE,
    "supplierId" INTEGER NOT NULL,
    "supplierName" VARCHAR(255) NOT NULL,
    "subtotal" BIGINT NOT NULL,
    "discountAmount" BIGINT NOT NULL DEFAULT 0,
    "taxAmount" BIGINT NOT NULL,
    "totalAmount" BIGINT NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "expectedDate" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "purchase_orders_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "purchase_orders_poNumber_idx" ON "purchase_orders"("poNumber");
CREATE INDEX "purchase_orders_supplierId_idx" ON "purchase_orders"("supplierId");
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders"("status");
CREATE INDEX "purchase_orders_createdAt_idx" ON "purchase_orders"("createdAt");

-- CreateTable CreatePurchaseOrderItems
CREATE TABLE "purchase_order_items" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "purchaseOrderId" INTEGER NOT NULL,
    "inventoryItemId" INTEGER NOT NULL,
    "itemName" VARCHAR(255) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" BIGINT NOT NULL,
    "discount" INTEGER NOT NULL,
    "taxRate" INTEGER NOT NULL,
    "subtotal" BIGINT NOT NULL,
    "receivedQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "purchase_order_items_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "purchase_order_items_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "purchase_order_items_purchaseOrderId_idx" ON "purchase_order_items"("purchaseOrderId");
CREATE INDEX "purchase_order_items_inventoryItemId_idx" ON "purchase_order_items"("inventoryItemId");

-- CreateTable CreateTransactions
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "type" VARCHAR(50) NOT NULL,
    "relatedType" VARCHAR(50) NOT NULL,
    "relatedId" INTEGER NOT NULL,
    "amount" BIGINT NOT NULL,
    "paymentMethod" VARCHAR(50) NOT NULL,
    "customerId" INTEGER,
    "supplierId" INTEGER,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "transactions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transactions_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transactions_relatedId_fkey" FOREIGN KEY ("relatedId") REFERENCES "bills" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "transactions_type_idx" ON "transactions"("type");
CREATE INDEX "transactions_customerId_idx" ON "transactions"("customerId");
CREATE INDEX "transactions_supplierId_idx" ON "transactions"("supplierId");
CREATE INDEX "transactions_createdAt_idx" ON "transactions"("createdAt");

-- CreateTable CreateStockMovements
CREATE TABLE "stock_movements" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "inventoryItemId" INTEGER NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "previousQuantity" INTEGER NOT NULL,
    "newQuantity" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stock_movements_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "stock_movements_inventoryItemId_idx" ON "stock_movements"("inventoryItemId");
CREATE INDEX "stock_movements_type_idx" ON "stock_movements"("type");
CREATE INDEX "stock_movements_createdAt_idx" ON "stock_movements"("createdAt");
