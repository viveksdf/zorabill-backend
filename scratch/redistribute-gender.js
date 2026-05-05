import "dotenv/config";
import prisma from "../src/config/database.js";

async function redistributeGender() {
  console.log("Starting customer gender redistribution...");
  
  try {
    const customers = await prisma.customer.findMany();
    console.log(`Found ${customers.length} customers.`);

    if (customers.length === 0) {
      console.log("No customers found to redistribute.");
      return;
    }

    let counts = { M: 0, F: 0, "Other": 0 };

    for (const cust of customers) {
      const rand = Math.random();
      let gender = "M";
      
      if (rand < 0.50) {
        gender = "M";
      } else if (rand < 0.90) {
        gender = "F";
      } else {
        gender = "Other";
      }

      await prisma.customer.update({
        where: { id: cust.id },
        data: { gender: gender }
      });

      counts[gender]++;
    }

    console.log("Gender redistribution complete!");
    console.log("Final Counts:", counts);
    console.log("Actual Percentages:", {
      M: ((counts.M / customers.length) * 100).toFixed(1) + "%",
      F: ((counts.F / customers.length) * 100).toFixed(1) + "%",
      Other: ((counts["Other"] / customers.length) * 100).toFixed(1) + "%"
    });
  } catch (err) {
    console.error("Error during redistribution:", err);
  } finally {
    await prisma.$disconnect();
  }
}

redistributeGender();
