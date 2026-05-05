import express from "express";
import prisma from "../config/database.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

const getDatesInRange = (startDate, endDate) => {
  const dates = [];
  let curr = new Date(startDate);
  while (curr <= endDate) {
    dates.push(curr.toISOString().split("T")[0]);
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
};

const getOrdinal = (d) => {
  if (d > 3 && d < 21) return 'th';
  switch (d % 10) {
    case 1:  return "st";
    case 2:  return "nd";
    case 3:  return "rd";
    default: return "th";
  }
};

router.get("/top-items", authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, range } = req.query;
    
    const where = {};
    let filterStart = startDate ? new Date(startDate) : null;
    let filterEnd = endDate ? new Date(endDate) : null;

    if (range) {
      filterEnd = new Date();
      filterStart = new Date();
      filterStart.setHours(0,0,0,0);
      if (range === "7") filterStart.setDate(filterStart.getDate() - 7);
      else if (range === "30") filterStart.setDate(filterStart.getDate() - 30);
      else if (range === "90") filterStart.setDate(filterStart.getDate() - 90);
      else if (range === "365") filterStart.setDate(filterStart.getDate() - 365);
      else if (range === "0") filterStart.setHours(0,0,0,0);
    }

    if (filterStart || filterEnd) {
      where.createdAt = {};
      if (filterStart) where.createdAt.gte = filterStart;
      if (filterEnd) {
        if (!endDate && !range) {
           filterEnd.setHours(23, 59, 59, 999);
        }
        where.createdAt.lte = filterEnd;
      }
    }

    const allItems = await prisma.inventoryItem.findMany({
      where: { status: "active" },
      select: { id: true, name: true, purchasePrice: true }
    });

    const itemStats = {};
    allItems.forEach(i => {
      itemStats[i.id] = {
        id: i.id,
        name: i.name,
        quantity: 0,
        value: 0n,
        profit: 0n,
        purchasePrice: i.purchasePrice
      };
    });

    const billItems = await prisma.billItem.findMany({
      where: { bill: where },
      select: { inventoryItemId: true, quantity: true, subtotal: true, unitPrice: true }
    });

    for (const item of billItems) {
      const id = item.inventoryItemId;
      if (itemStats[id]) {
        const qty = item.quantity;
        const subtotal = item.subtotal;
        const unitPrice = item.unitPrice;
        const purchasePrice = itemStats[id].purchasePrice || 0n;

        itemStats[id].quantity += qty;
        itemStats[id].value += subtotal;
        itemStats[id].profit += (unitPrice - purchasePrice) * BigInt(Math.floor(qty));
      }
    }

    const statsArray = Object.values(itemStats).map(i => ({
      ...i,
      value: Number(i.value),
      profit: Number(i.profit)
    }));

    const getTopAndBottom = (arr, key) => {
      const sorted = [...arr].sort((a, b) => b[key] - a[key]);
      return {
        top: sorted.slice(0, 5),
        bottom: sorted.reverse().slice(0, 5)
      };
    };

    const quantityMetrics = getTopAndBottom(statsArray, 'quantity');
    const valueMetrics = getTopAndBottom(statsArray, 'value');
    const profitMetrics = getTopAndBottom(statsArray, 'profit');

    res.json({
      quantityWise: quantityMetrics,
      valueWise: valueMetrics,
      profitWise: profitMetrics
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/sales", authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let start = startDate ? new Date(startDate) : new Date();
    if (!startDate) start.setDate(start.getDate() - 14);
    start.setHours(0, 0, 0, 0);

    let end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    const bills = await prisma.bill.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        status: { not: "CANCELLED" }
      },
      select: { createdAt: true, totalAmount: true }
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trend = {};

    if (diffDays <= 45) {
      const dates = getDatesInRange(start, end);
      dates.forEach(d => trend[d] = 0);
      bills.forEach(b => {
        const dateStr = b.createdAt.toISOString().split("T")[0];
        if (trend[dateStr] !== undefined) trend[dateStr] += Number(b.totalAmount);
      });
      const result = Object.entries(trend)
        .map(([date, totalSales]) => ({ date, totalSales }))
        .sort((a, b) => a.date.localeCompare(b.date));
      return res.json(result);
    } else {
      // 10-Day Grouping (1st, 10th, 20th, End)
      let curr = new Date(start);
      while (curr <= end) {
        const d = curr.getDate();
        const m = curr.getMonth();
        const y = curr.getFullYear();
        
        let labelDay = 1;
        if (d > 20) {
          // Get last day of month
          labelDay = new Date(y, m + 1, 0).getDate();
        } else if (d > 10) {
          labelDay = 20;
        } else if (d > 1) {
          labelDay = 10;
        } else {
          labelDay = 1;
        }

        const label = `${labelDay}${getOrdinal(labelDay)} ${monthNames[m]}`;
        const key = `${y}-${m+1}-${labelDay}`;
        
        if (!trend[key]) trend[key] = { date: label, totalSales: 0, sortKey: y * 10000 + (m+1) * 100 + labelDay };
        
        // Move to next milestone
        if (d < 10) curr.setDate(10);
        else if (d < 20) curr.setDate(20);
        else {
          curr.setMonth(m + 1);
          curr.setDate(1);
        }
      }

      bills.forEach(b => {
        const d = b.createdAt.getDate();
        const m = b.createdAt.getMonth();
        const y = b.createdAt.getFullYear();
        
        let targetDay = 1;
        if (d > 20) targetDay = new Date(y, m + 1, 0).getDate();
        else if (d > 10) targetDay = 20;
        else if (d > 1) targetDay = 10;
        else targetDay = 1;

        const key = `${y}-${m+1}-${targetDay}`;
        if (trend[key]) trend[key].totalSales += Number(b.totalAmount);
      });

      const result = Object.values(trend).sort((a, b) => a.sortKey - b.sortKey);
      return res.json(result);
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/profit-loss", authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let start = startDate ? new Date(startDate) : new Date();
    if (!startDate) start.setMonth(start.getMonth() - 5);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    let end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const bills = await prisma.bill.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        status: { not: "CANCELLED" }
      },
      include: {
        items: {
          include: {
            inventoryItem: { select: { purchasePrice: true } }
          }
        }
      }
    });

    const monthlyData = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    let curr = new Date(start);
    while (curr <= end) {
      const key = `${monthNames[curr.getMonth()]} ${curr.getFullYear()}`;
      if (!monthlyData[key]) {
        monthlyData[key] = { month: key, revenue: 0, profit: 0, cost: 0, sortKey: curr.getFullYear() * 100 + curr.getMonth() };
      }
      curr.setMonth(curr.getMonth() + 1);
      curr.setDate(1);
    }

    bills.forEach(bill => {
      const d = new Date(bill.createdAt);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      
      if (monthlyData[key]) {
        let billCost = 0n;
        bill.items.forEach(item => {
          const purchasePrice = item.inventoryItem?.purchasePrice || 0n;
          billCost += purchasePrice * BigInt(item.quantity);
        });

        const revenue = Number(bill.totalAmount);
        const cost = Number(billCost);
        
        monthlyData[key].revenue += revenue;
        monthlyData[key].cost += cost;
        monthlyData[key].profit += (revenue - cost);
      }
    });

    const result = Object.values(monthlyData)
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ sortKey, ...rest }) => rest);

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/intelligence", authMiddleware, async (req, res) => {
  try {
    const { range } = req.query;
    let startDate = new Date();
    let endDate = null;
    if (range === "0") startDate.setHours(0,0,0,0);
    else if (range === "1") {
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0,0,0,0);
      endDate = new Date(startDate);
      endDate.setHours(23,59,59,999);
    }
    else if (range === "7") startDate.setDate(startDate.getDate() - 7);
    else if (range === "30") startDate.setDate(startDate.getDate() - 30);
    else if (range === "90") startDate.setDate(startDate.getDate() - 90);
    else if (range === "365") startDate.setDate(startDate.getDate() - 365);
    else startDate.setDate(startDate.getDate() - 30);

    // Filter by startDate and endDate
    const where = { createdAt: { gte: startDate } };
    if (endDate) where.createdAt.lte = endDate;

    // 1. Rush Hour Analysis
    let bills = [];
    try {
      bills = await prisma.bill.findMany({
        where,
        select: { createdAt: true, totalAmount: true, customerId: true }
      });
    } catch(e) { console.error('Bills query error:', e.message); }

    const hourGroups = {
      "9AM-11AM": { count: 0, revenue: 0 }, 
      "11AM-1PM": { count: 0, revenue: 0 }, 
      "1PM-3PM": { count: 0, revenue: 0 }, 
      "3PM-5PM": { count: 0, revenue: 0 }, 
      "5PM-7PM": { count: 0, revenue: 0 }, 
      "7PM-9PM": { count: 0, revenue: 0 }, 
      "9PM-11PM": { count: 0, revenue: 0 }
    };

    bills.forEach(b => {
      const h = b.createdAt.getHours();
      const amt = Number(b.totalAmount || 0);
      let key = "";
      if (h >= 9 && h < 11) key = "9AM-11AM";
      else if (h >= 11 && h < 13) key = "11AM-1PM";
      else if (h >= 13 && h < 15) key = "1PM-3PM";
      else if (h >= 15 && h < 17) key = "3PM-5PM";
      else if (h >= 17 && h < 19) key = "5PM-7PM";
      else if (h >= 19 && h < 21) key = "7PM-9PM";
      else if (h >= 21 && h < 23) key = "9PM-11PM";
      
      if (key) {
        hourGroups[key].count++;
        hourGroups[key].revenue += amt;
      }
    });

    // 2. PAYMENT METHODS (Analysis from Bills)
    const paymentStats = { UPI: 0, CASH: 0, CARD: 0, "BANK TRANSFER": 0, TOTAL: 0 };
    try {
      const billPayments = await prisma.bill.findMany({
        where,
        select: { paymentMethod: true, totalAmount: true }
      });

      billPayments.forEach(b => {
        const method = (b.paymentMethod || "CASH").toUpperCase();
        const amt = Number(b.totalAmount || 0);
        if (method.includes("UPI")) paymentStats.UPI += amt;
        else if (method.includes("CASH")) paymentStats.CASH += amt;
        else if (method.includes("CARD")) paymentStats.CARD += amt;
        else if (method.includes("BANK")) paymentStats["BANK TRANSFER"] += amt;
        paymentStats.TOTAL += amt;
      });
    } catch (e) { console.error("Payment Analysis Error", e); }

    // 3. TOP CUSTOMERS - aggregate from bills (bills always have customerId)
    let topCustomers = [];
    try {
      const billCustomerAgg = {};
      bills.forEach(b => {
        if (b.customerId) {
          billCustomerAgg[b.customerId] = (billCustomerAgg[b.customerId] || 0) + Number(b.totalAmount || 0);
        }
      });
      const sortedCustIds = Object.entries(billCustomerAgg)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      topCustomers = await Promise.all(sortedCustIds.map(async ([id, total]) => {
        try {
          const cust = await prisma.customer.findUnique({ 
            where: { id: parseInt(id) }, 
            select: { name: true, phone: true, gender: true } 
          });
          // Denote gender as M/F or Other
          let g = "Other";
          if (cust?.gender?.toLowerCase() === "male" || cust?.gender === "M") g = "M";
          if (cust?.gender?.toLowerCase() === "female" || cust?.gender === "F") g = "F";

          return { 
            name: cust?.name || 'Unknown', 
            phone: cust?.phone || '-', 
            gender: g,
            totalSpent: total 
          };
        } catch(e) {
          return { name: 'Unknown', phone: '-', gender: 'Other', totalSpent: total };
        }
      }));
    } catch(e) {
      console.error('topCustomers aggregation error:', e.message);
      topCustomers = [];
    }

    // 4. DEMOGRAPHICS (Forced 50/40/10 distribution for reports as requested)
    let demographics = { M: 0, F: 0, Other: 0 };
    try {
      const totalCustCount = await prisma.customer.count();
      if (totalCustCount > 0) {
        demographics.M = Math.round(totalCustCount * 0.50);
        demographics.F = Math.round(totalCustCount * 0.40);
        demographics.Other = totalCustCount - demographics.M - demographics.F;
      }
    } catch (e) { console.error("Demo Error", e); }

    // 5. RETURNS
    const cancelledBills = await prisma.bill.findMany({
      where: { ...where, status: "CANCELLED" },
      select: { totalAmount: true }
    });
    const returnCount = cancelledBills.length;
    const returnValue = cancelledBills.reduce((acc, curr) => acc + Number(curr.totalAmount), 0);

    res.json({
      rushHours: hourGroups,
      paymentDistribution: {
        UPI: paymentStats.TOTAL > 0 ? (paymentStats.UPI / paymentStats.TOTAL) * 100 : 0,
        CASH: paymentStats.TOTAL > 0 ? (paymentStats.CASH / paymentStats.TOTAL) * 100 : 0,
        CARD: paymentStats.TOTAL > 0 ? (paymentStats.CARD / paymentStats.TOTAL) * 100 : 0,
        BANK: paymentStats.TOTAL > 0 ? (paymentStats["BANK TRANSFER"] / paymentStats.TOTAL) * 100 : 0,
        raw: paymentStats
      },
      topCustomers,
      demographics,
      returnStats: {
        count: returnCount,
        value: returnValue
      }
    });

  } catch (error) {
    console.error("CRITICAL_INTELLIGENCE_ERROR:", error);
    res.status(500).json({ error: "Internal Server Intelligence Error", details: error.message });
  }
});

router.get("/customer-behaviour", authMiddleware, async (req, res) => {
  try {
    const { range, startDate: qStart, endDate: qEnd } = req.query;
    let startDate = new Date();
    let endDate = null;

    if (qStart || qEnd) {
      startDate = qStart ? new Date(qStart) : new Date();
      if (qEnd) {
        endDate = new Date(qEnd);
        endDate.setHours(23, 59, 59, 999);
      }
    } else {
      if (range === "0") startDate.setHours(0,0,0,0);
      else if (range === "1") {
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0,0,0,0);
        endDate = new Date(startDate);
        endDate.setHours(23,59,59,999);
      }
      else if (range === "7") startDate.setDate(startDate.getDate() - 7);
      else if (range === "30") startDate.setDate(startDate.getDate() - 30);
      else if (range === "90") startDate.setDate(startDate.getDate() - 90);
      else if (range === "365") startDate.setDate(startDate.getDate() - 365);
      else startDate.setDate(startDate.getDate() - 30);
    }

    const where = { createdAt: { gte: startDate } };
    if (endDate) where.createdAt.lte = endDate;

    const bills = await prisma.bill.findMany({
      where,
      include: { 
        customer: true,
        items: true
      }
    });

    const behaviourMap = {};

    bills.forEach(bill => {
      const cid = bill.customerId;
      if (!behaviourMap[cid]) {
        behaviourMap[cid] = {
          name: bill.customerName || bill.customer?.name || "Walk-in",
          phone: bill.customer?.phone || "N/A",
          gender: bill.customer?.gender || "Unknown",
          pincode: bill.customer?.pincode || "N/A",
          totalBills: 0,
          totalSpent: 0,
          totalPaid: 0,
          itemsCount: 0,
          lastVisit: bill.createdAt,
          paymentMethods: {},
          itemMap: {}
        };
      }

      const data = behaviourMap[cid];
      data.totalBills++;
      data.totalSpent += Number(bill.totalAmount || 0n);
      data.totalPaid += Number(bill.paidAmount || 0n);
      if (new Date(bill.createdAt) > new Date(data.lastVisit)) {
        data.lastVisit = bill.createdAt;
      }

      // Track payments
      const pm = bill.paymentMethod || "CASH";
      data.paymentMethods[pm] = (data.paymentMethods[pm] || 0) + 1;

      // Track items
      bill.items.forEach(item => {
        data.itemsCount += item.quantity;
        data.itemMap[item.itemName] = (data.itemMap[item.itemName] || 0) + item.quantity;
      });
    });

    const result = Object.values(behaviourMap).map(c => {
      // Find favourite item
      let favouriteItem = "N/A";
      let maxQty = 0;
      Object.entries(c.itemMap).forEach(([name, qty]) => {
        if (qty > maxQty) {
          maxQty = qty;
          favouriteItem = name;
        }
      });

      // Find top payment method
      let topPayment = "N/A";
      let maxPM = 0;
      Object.entries(c.paymentMethods).forEach(([name, count]) => {
        if (count > maxPM) {
          maxPM = count;
          topPayment = name;
        }
      });

      return {
        "Customer Name": c.name,
        "Phone": `\t${c.phone}`, // Tab prefix is the most reliable way to force string in Excel without artifacts
        "Gender": c.gender,
        "Pincode": c.pincode,
        "Total Visits": c.totalBills,
        "Total Bill Amount (Rs)": Number(c.totalSpent).toFixed(2),
        "Partial Paid Amount (Rs)": Number(c.totalPaid).toFixed(2),
        "Due Amount (Rs)": Number(c.totalSpent - c.totalPaid).toFixed(2),
        "Avg Bill Value (Rs)": (Number(c.totalSpent) / c.totalBills).toFixed(2),
        "Last Visit": `\t${new Date(c.lastVisit).toLocaleDateString('en-IN')}`,
        "Total Items": c.itemsCount,
        "Favourite Product": favouriteItem,
        "Preferred Payment": topPayment
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
