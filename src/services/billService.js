import prisma from "../config/database.js";
import crypto from "crypto";

// ============================================================================
// BILL SERVICE
// ============================================================================

/**
 * Generate a random unique 6-character uppercase hex bill code.
 * Retries if a collision is detected in the database.
 */
async function generateBillCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 chars
    const existing = await prisma.bill.findUnique({ where: { billCode: code } });
    if (!existing) return code;
  }
  // Fallback to longer code if too many collisions
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

/**
 * Derive bill status from paidAmount vs totalAmount.
 */
function deriveStatus(paidAmount, totalAmount) {
  if (paidAmount <= 0n) return "unpaid";
  if (paidAmount >= totalAmount) return "paid";
  return "partial";
}

export const billService = {
  // Get all bills with pagination
  async findAll(page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;

    const where = {};
    if (filters.search) {
      where.OR = [
        { billNumber: { contains: filters.search, mode: "insensitive" } },
        { customerName: { contains: filters.search, mode: "insensitive" } },
        { billCode: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    if (filters.status) {
      const statusArr = Array.isArray(filters.status) ? filters.status : [filters.status];
      where.status = { in: statusArr };
    }
    if (filters.customerId) {
      where.customerId = parseInt(filters.customerId);
    }
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(new Date(filters.endDate).setHours(23, 59, 59, 999));
    }

    const [bills, total, summaryAggs] = await Promise.all([
      prisma.bill.findMany({
        where,
        skip,
        take: limit,
        include: { items: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.bill.count({ where }),
      prisma.bill.groupBy({
        by: ["status"],
        where,
        _sum: {
          totalAmount: true,
          paidAmount: true,
        },
      }),
    ]);

    // Compute global financial stats from status groups
    const summary = { total: 0, paid: 0, unpaid: 0, partial: 0 };
    
    for (const group of summaryAggs) {
      const totalAmt = Number(group._sum.totalAmount || 0n);
      const paidAmt = Number(group._sum.paidAmount || 0n);
      
      summary.total += totalAmt;
      
      if (group.status === "paid") {
        summary.paid += totalAmt;
      } else if (group.status === "unpaid") {
        summary.unpaid += totalAmt;
      } else if (group.status === "partial") {
        summary.partial += paidAmt;
      }
    }

    return {
      data: bills,
      summary,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  },

  // Get single bill by ID
  async findById(id) {
    const bill = await prisma.bill.findUnique({
      where: { id: parseInt(id) },
      include: { items: true, customer: true },
    });

    if (!bill) throw new Error("Bill not found");
    return bill;
  },

  // Get single bill by billCode (for returns)
  async findByBillCode(billCode) {
    const bill = await prisma.bill.findUnique({
      where: { billCode: billCode.toUpperCase() },
      include: { items: true, customer: true },
    });

    if (!bill) throw new Error("No bill found with that code");
    return bill;
  },

  // Create bill (accepts newCustomer or customerId, computes totals)
  async create(data) {
    const billCode = data.billCode || await generateBillCode();
    const billNumber = data.billNumber || await billService.getNextBillNumber();

    // Compute totals from items
    const itemsList = data.items || [];
    let subtotal = 0;
    let discountAmount = 0;
    let taxAmount = 0;

    for (const item of itemsList) {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const discPct = Number(item.discount) || 0;
      const taxPct = Number(item.taxRate) || 0;

      const lineBase = qty * price;
      const lineDisc = lineBase * (discPct / 100);
      const lineAfter = lineBase - lineDisc;
      const lineTax = lineAfter * (taxPct / 100);

      subtotal += lineBase;
      discountAmount += lineDisc;
      taxAmount += lineTax;
    }

    const totalAmount = subtotal - discountAmount + taxAmount;
    const finalTotalAmount = BigInt(Math.round(totalAmount));

    // Determine paidAmount
    let paidAmount = 0n;
    if (data.status === "paid") {
      paidAmount = finalTotalAmount;
    } else if (data.paidAmount != null && Number(data.paidAmount) > 0) {
      paidAmount = BigInt(Math.round(Number(data.paidAmount)));
    }

    // Derive status from paidAmount
    const status = deriveStatus(paidAmount, finalTotalAmount);

    const bill = await prisma.$transaction(async (tx) => {
      // If newCustomer is provided, create the customer first
      let customerId = data.customerId ? parseInt(data.customerId) : null;
      let customerName = data.customerName;

      if (data.newCustomer) {
        let existingCust = null;
        
        // Priority 1: Use customerId if provided
        if (customerId) {
          existingCust = await tx.customer.findUnique({ where: { id: customerId } });
        } 
        // Priority 2: Try to find by phone if customerId wasn't found/provided
        else if (data.newCustomer.phone) {
          existingCust = await tx.customer.findUnique({ where: { phone: data.newCustomer.phone } });
        }

        if (existingCust) {
          // Update existing customer details if provided
          const updatedCust = await tx.customer.update({
            where: { id: existingCust.id },
            data: {
              name: (data.newCustomer.name && !data.newCustomer.name.toLowerCase().includes("walk-in")) ? data.newCustomer.name : existingCust.name,
              email: data.newCustomer.email || existingCust.email,
              gstNumber: data.newCustomer.gstNumber || existingCust.gstNumber,
            }
          });
          customerId = updatedCust.id;
          customerName = updatedCust.name;
        } else {
          // Create truly new customer
          const newCust = await tx.customer.create({
            data: {
              name: (data.newCustomer.name && !data.newCustomer.name.toLowerCase().includes("walk-in")) ? data.newCustomer.name : "Walk-in",
              phone: data.newCustomer.phone || null,
              email: data.newCustomer.email || null,
              gstNumber: data.newCustomer.gstNumber || null,
            },
          });
          customerId = newCust.id;
          customerName = newCust.name;
        }
      }

      // Look up customer name if not provided
      if (!customerName && customerId) {
        const customer = await tx.customer.findUnique({
          where: { id: customerId },
          select: { name: true },
        });
        customerName = customer?.name || "Walk-in";
      }

      if (!customerId) {
        throw new Error("A customer or new customer details are required");
      }

      const createdBill = await tx.bill.create({
        data: {
          billNumber,
          billCode,
          customerId,
          customerName,
          subtotal: BigInt(Math.round(subtotal)),
          discountAmount: BigInt(Math.round(discountAmount)),
          taxAmount: BigInt(Math.round(taxAmount)),
          totalAmount: finalTotalAmount,
          paidAmount,
          status,
          paymentMethod: data.paymentMethod || null,
          notes: data.notes || null,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          items: {
            create: itemsList.map(i => {
              const qty = Number(i.quantity) || 0;
              const price = Number(i.unitPrice) || 0;
              const itemSubtotal = BigInt(Math.round(qty * price));

              return {
                inventoryItemId: parseInt(i.inventoryItemId),
                itemName: i.itemName || "Unknown Item",
                quantity: qty,
                unitPrice: BigInt(Math.round(price)),
                discount: Number(i.discount) || 0,
                taxRate: Number(i.taxRate) || 0,
                subtotal: itemSubtotal,
              };
            }),
          },
        },
        include: { items: true },
      });

      // Deduct stock for each item
      for (const item of itemsList) {
        if (!item.inventoryItemId) continue;
        const invItem = await tx.inventoryItem.findUnique({
          where: { id: parseInt(item.inventoryItemId) }
        });
        if (invItem) {
          const qty = Number(item.quantity) || 0;
          const multiplier = invItem.unitValue || 1.0;
          const deduction = qty * multiplier;
          
          await tx.inventoryItem.update({
            where: { id: invItem.id },
            data: { currentQuantity: { decrement: deduction } }
          });

          await tx.stockMovement.create({
            data: {
              inventoryItemId: invItem.id,
              type: "SALE",
              quantity: deduction,
              previousQuantity: invItem.currentQuantity,
              newQuantity: invItem.currentQuantity - deduction,
              reason: `Bill #${billNumber}`,
            }
          });
        }
      }

      return createdBill;
    });

    return bill;
  },

  // Update bill
  async update(id, data) {
    const existingBill = await prisma.bill.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingBill) throw new Error("Bill not found");

    // Determine new paidAmount and status
    let paidAmount = existingBill.paidAmount;
    if (data.paidAmount != null) {
      paidAmount = BigInt(Math.round(Number(data.paidAmount)));
    }
    // If explicitly marking as paid, set paidAmount to totalAmount
    if (data.status === "paid") {
      paidAmount = existingBill.totalAmount;
    }

    const status = data.status === "draft" ? "draft" : deriveStatus(paidAmount, existingBill.totalAmount);

    const bill = await prisma.bill.update({
      where: { id: parseInt(id) },
      data: {
        status,
        paidAmount,
        notes: data.notes !== undefined ? data.notes : undefined,
        dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined,
        paidDate: status === "paid" ? new Date() : (data.paidDate ? new Date(data.paidDate) : null),
      },
      include: { items: true },
    });

    return bill;
  },

  // Delete bill and cleanup orphaned customer
  async delete(id) {
    const billId = parseInt(id);
    
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch bill to get customer reference
      const bill = await tx.bill.findUnique({
        where: { id: billId },
        select: { customerId: true }
      });

      if (!bill) throw new Error("Bill not found");

      // 2. Delete the bill
      await tx.bill.delete({
        where: { id: billId },
      });

      // 3. Automated Cleanup: If no more bills exist for this customer, remove them
      if (bill.customerId) {
        const remainingRecords = await tx.bill.count({
          where: { customerId: bill.customerId }
        });

        if (remainingRecords === 0) {
          // Double check there are no other references if needed, 
          // but for this app, Bill is the primary relationship.
          await tx.customer.delete({
            where: { id: bill.customerId }
          }).catch(() => {
            // Ignore if deletion fails (e.g. if other relations exist that we missed)
            console.log(`Failed to cleanup orphaned customer ${bill.customerId}`);
          });
        }
      }
    });
  },

  // Get next bill number
  async getNextBillNumber() {
    const lastBill = await prisma.bill.findFirst({
      orderBy: { id: "desc" },
      select: { billNumber: true },
    });

    if (!lastBill) return "INV-0001";

    const lastNumber = parseInt(lastBill.billNumber.split("-")[1]);
    return `INV-${String(lastNumber + 1).padStart(4, "0")}`;
  },
};
