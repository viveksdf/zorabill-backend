import "dotenv/config";
import prisma from "../src/config/database.js";

async function redistributePaymentMethods() {
  console.log("Starting payment method redistribution...");
  
  try {
    const bills = await prisma.bill.findMany();
    console.log(`Found ${bills.length} bills.`);

    if (bills.length === 0) {
      console.log("No bills found to redistribute.");
      return;
    }

    let counts = { UPI: 0, Cash: 0, Card: 0, "Bank Transfer": 0 };

    for (const bill of bills) {
      const rand = Math.random();
      let method = "UPI";
      
      if (rand < 0.80) {
        method = "UPI";
      } else if (rand < 0.90) {
        method = "Cash";
      } else if (rand < 0.95) {
        method = "Card";
      } else {
        method = "Bank Transfer";
      }

      await prisma.bill.update({
        where: { id: bill.id },
        data: { paymentMethod: method }
      });

      counts[method]++;
    }

    console.log("Redistribution complete!");
    console.log("Final Counts:", counts);
    console.log("Actual Percentages:", {
      UPI: ((counts.UPI / bills.length) * 100).toFixed(1) + "%",
      Cash: ((counts.Cash / bills.length) * 100).toFixed(1) + "%",
      Card: ((counts.Card / bills.length) * 100).toFixed(1) + "%",
      Bank: ((counts["Bank Transfer"] / bills.length) * 100).toFixed(1) + "%"
    });
  } catch (err) {
    console.error("Error during redistribution:", err);
  } finally {
    await prisma.$disconnect();
  }
}

redistributePaymentMethods();
