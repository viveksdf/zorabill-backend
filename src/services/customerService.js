import prisma from "../config/database.js";

// ============================================================================
// CUSTOMER SERVICE
// ============================================================================

export const customerService = {
  // Get all customers with pagination
  async findAll(page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;

    const where = {};
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { phone: { contains: filters.search } },
      ];
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.withDebt === "true" || filters.withDebt === true) {
      where.bills = { some: { status: { in: ["unpaid", "partial"] } } };
    }
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = new Date(filters.fromDate);
      if (filters.toDate) where.createdAt.lte = new Date(new Date(filters.toDate).setHours(23, 59, 59, 999));
    }

    let orderBy = { createdAt: "desc" };
    if (filters.sortBy === "oldest") orderBy = { createdAt: "asc" };
    if (filters.sortBy === "name") orderBy = { name: "asc" };

    const [customers, total, activeCount, globalBillAggs] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.customer.count({ where }),
      prisma.customer.count({ where: { ...where, status: "active" } }),
      prisma.bill.groupBy({
        by: ["customerId"],
        where: { customer: where },
        _sum: {
          totalAmount: true,
          paidAmount: true,
        },
      }),
    ]);

    // Compute global debt stats from bill aggregates
    let totalOutstanding = 0;
    let debtCustomersCount = 0;
    
    for (const agg of globalBillAggs) {
      const balance = Number(agg._sum.totalAmount || 0n) - Number(agg._sum.paidAmount || 0n);
      if (balance > 0) {
        totalOutstanding += balance;
        debtCustomersCount++;
      }
    }

    // Compute totalBilled and totalPaid from bills for each customer on CURRENT PAGE
    const customerIds = customers.map(c => c.id);

    const currentPageBillAggs = await prisma.bill.groupBy({
      by: ["customerId"],
      where: { customerId: { in: customerIds } },
      _sum: {
        totalAmount: true,
        paidAmount: true,
      },
    });

    const aggregateMap = {};
    for (const agg of currentPageBillAggs) {
      aggregateMap[agg.customerId] = {
        totalBilled: Number(agg._sum.totalAmount || 0n),
        totalPaid: Number(agg._sum.paidAmount || 0n),
      };
    }

    const enrichedCustomers = customers.map(c => {
      const agg = aggregateMap[c.id] || { totalBilled: 0, totalPaid: 0 };
      return {
        ...c,
        totalBilled: agg.totalBilled,
        totalPaid: agg.totalPaid,
        outstandingBalance: agg.totalBilled - agg.totalPaid,
      };
    });

    return {
      data: enrichedCustomers,
      summary: {
        total,
        active: activeCount,
        withDebt: debtCustomersCount,
        totalOutstanding,
      },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  },

  // Get single customer
  async findById(id) {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(id) },
      include: { bills: { take: 5, orderBy: { createdAt: "desc" } } },
    });

    if (!customer) throw new Error("Customer not found");

    // Compute totals from bills
    const billAggregates = await prisma.bill.aggregate({
      where: { customerId: parseInt(id) },
      _sum: {
        totalAmount: true,
        paidAmount: true,
      },
      _count: { id: true },
      _max: { createdAt: true }
    });

    // Total profit calculation (Approximation using current purchasePrice)
    const items = await prisma.billItem.findMany({
      where: { bill: { customerId: parseInt(id) } },
      include: { inventoryItem: { select: { purchasePrice: true } } }
    });
    
    let totalProfit = 0;
    for (const item of items) {
      const sellPrice = Number(item.unitPrice);
      const buyPrice = Number(item.inventoryItem?.purchasePrice || 0n);
      const qty = item.quantity;
      // subtotal in BillItem is usually (sellPrice * qty) - discount. 
      // For simplicity, we use (sell - buy) * qty.
      totalProfit += (sellPrice - buyPrice) * qty;
    }

    return {
      ...customer,
      totalBilled: Number(billAggregates._sum.totalAmount || 0n),
      totalPaid: Number(billAggregates._sum.paidAmount || 0n),
      outstandingBalance: Number(billAggregates._sum.totalAmount || 0n) - Number(billAggregates._sum.paidAmount || 0n),
      billCount: billAggregates._count.id,
      lastPurchaseDate: billAggregates._max.createdAt,
      totalProfit: totalProfit
    };
  },

  // Create customer
  async create(data) {
    if (data.phone) {
      const existing = await prisma.customer.findUnique({ where: { phone: data.phone } });
      if (existing) {
        return await prisma.customer.update({
          where: { id: existing.id },
          data: {
            name: data.name || existing.name,
            email: data.email || existing.email,
            address: data.address || existing.address,
            pincode: data.pincode || existing.pincode,
            gender: data.gender || existing.gender,
            gstNumber: data.gstNumber || existing.gstNumber,
            panNumber: data.panNumber || existing.panNumber,
          },
        });
      }
    }

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        pincode: data.pincode,
        gender: data.gender,
        gstNumber: data.gstNumber,
        panNumber: data.panNumber,
      },
    });
    return customer;
  },

  // Update customer
  async update(id, data) {
    const customer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: {
        name: data.name,
        email: data.email,
        address: data.address,
        pincode: data.pincode,
        gender: data.gender,
        gstNumber: data.gstNumber,
        panNumber: data.panNumber,
        status: data.status,
      },
    });
    return customer;
  },

  // Delete customer
  async delete(id) {
    await prisma.customer.delete({
      where: { id: parseInt(id) },
    });
  },

  // Get customer balance (computed from bills)
  async getBalance(id) {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(id) },
    });

    if (!customer) throw new Error("Customer not found");

    const billTotals = await prisma.bill.aggregate({
      where: { customerId: parseInt(id) },
      _sum: {
        totalAmount: true,
        paidAmount: true,
      },
    });

    const totalBilled = Number(billTotals._sum.totalAmount || 0n);
    const totalPaid = Number(billTotals._sum.paidAmount || 0n);

    return {
      customerId: customer.id,
      totalBilled,
      totalPaid,
      balance: totalBilled - totalPaid,
    };
  },

  // Search customers by phone (for autocomplete)
  async searchByPhone(phone) {
    if (!phone || phone.length < 3) return [];

    const customers = await prisma.customer.findMany({
      where: {
        phone: { contains: phone },
        status: "active",
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        pincode: true,
        gender: true,
        gstNumber: true,
      },
    });

    return customers;
  },
};
