import 'dotenv/config';
import prisma from '../src/config/database.js';

const normalize = (phone) => {
  if (!phone) return null;
  const clean = phone.replace(/\D/g, "");
  // If it's 10 digits, add 91
  if (clean.length === 10) return `91${clean}`;
  // If it's already 12 digits starting with 91, return as is
  if (clean.length === 12 && clean.startsWith("91")) return clean;
  // Otherwise, just return clean digits
  return clean;
};

async function migrate() {
  console.log("🚀 Starting Phone Number Migration...");

  // 1. Settings
  const settings = await prisma.setting.findMany();
  for (const s of settings) {
    if (s.phone) {
      const normalized = normalize(s.phone);
      if (normalized !== s.phone) {
        await prisma.setting.update({
          where: { id: s.id },
          data: { phone: normalized }
        });
        console.log(`✅ Updated Setting Phone: ${s.phone} -> ${normalized}`);
      }
    }
  }

  // 2. Customers
  const customers = await prisma.customer.findMany();
  let customerCount = 0;
  for (const c of customers) {
    if (c.phone) {
      const normalized = normalize(c.phone);
      if (normalized !== c.phone) {
        await prisma.customer.update({
          where: { id: c.id },
          data: { phone: normalized }
        });
        customerCount++;
      }
    }
  }
  console.log(`✅ Updated ${customerCount} Customers`);

  // 3. Suppliers
  const suppliers = await prisma.supplier.findMany();
  let supplierCount = 0;
  for (const s of suppliers) {
    if (s.phone) {
      const normalized = normalize(s.phone);
      if (normalized !== s.phone) {
        await prisma.supplier.update({
          where: { id: s.id },
          data: { phone: normalized }
        });
        supplierCount++;
      }
    }
  }
  console.log(`✅ Updated ${supplierCount} Suppliers`);

  console.log("🏁 Migration Complete!");
}

migrate()
  .catch(e => {
    console.error("❌ Migration Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
