
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
  const count = await prisma.customer.count();
  const billsCount = await prisma.bill.count();
  console.log(`Total Customers: ${count}`);
  console.log(`Total Bills: ${billsCount}`);
  const firstCustomer = await prisma.customer.findFirst();
  console.log('First Customer Sample:', firstCustomer);
}

check().finally(() => prisma.$disconnect());
