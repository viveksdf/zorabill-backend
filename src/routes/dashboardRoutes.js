import express from "express";
import prisma from "../config/database.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Dashboard summary with Multi-Timeframe Analytics
router.get("/summary", authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, range } = req.query;
    
    const calculateGrowth = (curr, prev) => {
      if (prev === 0n) return curr > 0n ? 100 : 0;
      try {
        return Number(((curr - prev) * 100n) / prev);
      } catch (e) {
        return 0;
      }
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter Dates
    let filterStart = startDate ? new Date(startDate) : today;
    let filterEnd = endDate ? new Date(endDate) : new Date();
    if (endDate) filterEnd.setHours(23, 59, 59, 999);

    // Handle range shorthand
    if (range) {
      filterEnd = new Date(); // current time
      filterStart = new Date();
      filterStart.setHours(0,0,0,0);
      if (range === "7") filterStart.setDate(filterStart.getDate() - 7);
      else if (range === "30") filterStart.setDate(filterStart.getDate() - 30);
      else if (range === "90") filterStart.setDate(filterStart.getDate() - 90);
      else if (range === "365") filterStart.setDate(filterStart.getDate() - 365);
      else if (range === "1") {
        filterStart.setDate(filterStart.getDate() - 1);
        filterEnd = new Date(filterStart);
        filterEnd.setHours(23, 59, 59, 999);
      }
      else if (range === "0") filterStart.setHours(0,0,0,0);
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Parallelize all high-level counts and simple sums for speed
    const [
      totalCustomers,
      inventorySummary,
      allTimeSalesAgg,
      pendingSummary,
      periodSummary,
      todaySummary,
      yesterdaySummary,
      weeklySummary,
      monthlySummary,
    ] = await Promise.all([
      prisma.customer.count().catch(() => 0),
      prisma.inventoryItem.aggregate({
        where: { status: "active" },
        _sum: { currentQuantity: true },
        _count: { id: true }
      }).catch(() => ({ _sum: { currentQuantity: 0 }, _count: { id: 0 } })),
      prisma.bill.aggregate({
        where: { status: { not: "quotation" } },
        _sum: { totalAmount: true }
      }).catch(() => ({ _sum: { totalAmount: 0n } })),
      prisma.bill.aggregate({
        where: { status: { in: ["unpaid", "partial"] } },
        _sum: { totalAmount: true, paidAmount: true }
      }).catch(() => ({ _sum: { totalAmount: 0n, paidAmount: 0n } })),
      
      // Main Filtered Period
      prisma.bill.aggregate({ 
        where: { createdAt: { gte: filterStart, lte: filterEnd }, status: { not: "quotation" } }, 
        _sum: { totalAmount: true },
        _count: { id: true } 
      }),

      // Standard Timeframes for trends
      prisma.bill.aggregate({ where: { createdAt: { gte: today }, status: { not: "quotation" } }, _sum: { totalAmount: true } }),
      prisma.bill.aggregate({ where: { createdAt: { gte: yesterday, lt: today }, status: { not: "quotation" } }, _sum: { totalAmount: true } }),
      prisma.bill.aggregate({ where: { createdAt: { gte: sevenDaysAgo, lt: today }, status: { not: "quotation" } }, _sum: { totalAmount: true } }),
      prisma.bill.aggregate({ where: { createdAt: { gte: thirtyDaysAgo, lt: today }, status: { not: "quotation" } }, _sum: { totalAmount: true } }),
    ]);

    // 2. Optimized Profit & Stock Calculation
    const items = await prisma.inventoryItem.findMany({
      where: { status: "active" },
      select: { currentQuantity: true, sellingPrice: true, purchasePrice: true, lowStockThreshold: true, expiryDate: true },
    }).catch(() => []);

    const totalStockValue = items.reduce((acc, item) => acc + BigInt(Math.floor(item.currentQuantity || 0)) * (item.sellingPrice || 0n), 0n);
    const lowStockCount = items.filter(i => i.currentQuantity <= i.lowStockThreshold && i.currentQuantity > 0).length;

    // 3. Robust Profit Logic
    const getProfitForPeriod = async (start, end = null) => {
      const billItems = await prisma.billItem.findMany({
        where: { 
          bill: { 
            createdAt: end ? { gte: start, lt: end } : { gte: start },
            status: { not: "quotation" } 
          } 
        },
        include: { inventoryItem: { select: { purchasePrice: true } } }
      }).catch(() => []);

      let profit = 0n;
      billItems.forEach(item => {
        const rev = item.subtotal || 0n;
        const cost = (item.inventoryItem?.purchasePrice || 0n) * BigInt(Math.floor(item.quantity || 0));
        profit += (rev - cost);
      });
      return profit;
    };

    const periodProfit = await getProfitForPeriod(filterStart, filterEnd);
    const todayProfit = await getProfitForPeriod(today);
    const yesterdayProfit = await getProfitForPeriod(yesterday, today);

    // 4. Resolve New Customer Counts
    const getCustCount = async (start, end = null) => {
      return prisma.customer.count({ where: { createdAt: end ? { gte: start, lt: end } : { gte: start } } }).catch(() => 0);
    };
    const [periodNewCustomers, newCustYesterday] = await Promise.all([
      getCustCount(filterStart, filterEnd),
      getCustCount(yesterday, today),
    ]);

    // 5. Unpaid Calculation
    const currentUnpaid = (pendingSummary._sum.totalAmount || 0n) - (pendingSummary._sum.paidAmount || 0n);

    // Trend comparisons for unpaid
    const getUnpaidAtPoint = async (point) => {
      const agg = await prisma.bill.aggregate({
        where: { 
          createdAt: { lt: point }, 
          status: { not: "quotation" },
          OR: [{ status: { in: ["unpaid", "partial"] } }, { paidDate: { gte: point } }]
        },
        _sum: { totalAmount: true, paidAmount: true }
      }).catch(() => ({ _sum: { totalAmount: 0n, paidAmount: 0n } }));
      return (agg._sum.totalAmount || 0n) - (agg._sum.paidAmount || 0n);
    };

    const [unpaidYesterday, unpaidLastWeek, unpaidLastMonth] = await Promise.all([
      getUnpaidAtPoint(today),
      getUnpaidAtPoint(sevenDaysAgo),
      getUnpaidAtPoint(thirtyDaysAgo)
    ]);

    // Format final response
    const todaySales = todaySummary._sum.totalAmount || 0n;
    const yesterdaySales = yesterdaySummary._sum.totalAmount || 0n;
    const periodSales = periodSummary._sum.totalAmount || 0n;
    const lastWeekSales = weeklySummary._sum.totalAmount || 0n;
    const lastMonthSales = monthlySummary._sum.totalAmount || 0n;

    res.json({
      isFiltered: !!(startDate || endDate),
      totalStockValue: Number(totalStockValue),
      lowStockCount,
      todaySales: Number(todaySales),
      todayProfit: Number(todayProfit),
      periodSales: Number(periodSales),
      periodProfit: Number(periodProfit),
      totalBills: periodSummary._count.id || 0,
      periodNewCustomers,
      allTimeSales: Number(allTimeSalesAgg._sum.totalAmount || 0n),
      unpaidAmount: Number(currentUnpaid),
      totalCustomers,
      expiringItemsCount: items.filter(i => {
        if (!i.expiryDate) return false;
        const d = new Date(i.expiryDate);
        const thirty = new Date(today);
        thirty.setDate(thirty.getDate() + 30);
        return d >= today && d <= thirty;
      }).length,
      growth: {
        yesterday: {
          sales: calculateGrowth(todaySales, yesterdaySales),
          profit: calculateGrowth(todayProfit, yesterdayProfit),
          customers: newCustYesterday,
          unpaid: calculateGrowth(currentUnpaid, unpaidYesterday),
        },
        weekly: {
          sales: calculateGrowth(todaySales, lastWeekSales / 7n),
          profit: calculateGrowth(todayProfit, (await getProfitForPeriod(sevenDaysAgo, today)) / 7n),
          customers: await getCustCount(sevenDaysAgo, today),
          unpaid: calculateGrowth(currentUnpaid, unpaidLastWeek),
        },
        monthly: {
          sales: calculateGrowth(todaySales, lastMonthSales / 30n),
          profit: calculateGrowth(todayProfit, (await getProfitForPeriod(thirtyDaysAgo, today)) / 30n),
          customers: await getCustCount(thirtyDaysAgo, today),
          unpaid: calculateGrowth(currentUnpaid, unpaidLastMonth),
        }
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Recent activity (Combined Pulse Feed)
router.get("/recent-activity", authMiddleware, async (req, res) => {
  try {
    // 1. Fetch latest 8 bills
    const bills = await prisma.bill.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      select: { id: true, billNumber: true, status: true, customerName: true, totalAmount: true, createdAt: true },
    });

    const billActivity = bills.map((b) => ({
      id: `bill-${b.id}`,
      type: b.status === "paid" ? "payment_received" : "bill_created",
      title: b.status === "paid" ? `Payment: ${b.customerName}` : `New Bill: #${b.billNumber}`,
      description: b.status === "paid" ? `Invoice #${b.billNumber} settled by ${b.customerName}` : `Drafted for ${b.customerName}`,
      amount: Number(b.totalAmount),
      createdAt: b.createdAt,
    }));

    // 2. Fetch latest 3 new customers
    const newCustomers = await prisma.customer.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, createdAt: true },
    });

    const customerActivity = newCustomers.map(c => ({
      id: `cust-${c.id}`,
      type: "customer_joined",
      title: "New Customer",
      description: `${c.name} has been added to your database`,
      amount: null,
      createdAt: c.createdAt,
    }));

    // 3. Fetch low stock items (Top 5 most critical)
    const inventory = await prisma.inventoryItem.findMany({
      where: { status: "active" },
      select: { id: true, name: true, currentQuantity: true, lowStockThreshold: true, updatedAt: true }
    });

    const lowStockActivity = inventory
      .filter(i => i.currentQuantity <= i.lowStockThreshold)
      .map(i => ({
        id: `stock-${i.id}`,
        type: "stock_alert",
        title: "Low Stock Alert",
        description: `${i.name} is low on stock (${i.currentQuantity} left)`,
        amount: null,
        createdAt: i.updatedAt,
      }))
      .slice(0, 5);

    // 4. Combine and Sort
    const allActivity = [...billActivity, ...customerActivity, ...lowStockActivity]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    res.json(allActivity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
