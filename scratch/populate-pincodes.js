import "dotenv/config";
import prisma from "../src/config/database.js";

async function populatePincodes() {
  console.log("Starting customer pincode population...");
  
  try {
    const customers = await prisma.customer.findMany();
    console.log(`Found ${customers.length} customers.`);

    if (customers.length === 0) {
      console.log("No customers found to update.");
      return;
    }

    for (const cust of customers) {
      // Generate a realistic Indian pincode (e.g., starting with 1-8)
      const firstDigit = Math.floor(Math.random() * 8) + 1;
      const remainingDigits = Math.floor(Math.random() * 90000) + 10000;
      const pincode = `${firstDigit}${remainingDigits}`;

      await prisma.customer.update({
        where: { id: cust.id },
        data: { pincode: pincode }
      });
    }

    console.log("Pincode population complete!");
  } catch (err) {
    console.error("Error during population:", err);
  } finally {
    await prisma.$disconnect();
  }
}

populatePincodes();
