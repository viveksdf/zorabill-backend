import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const bills = await prisma.bill.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true, totalAmount: true, customerName: true }
  });
  console.log('LATEST BILLS:', JSON.stringify(bills, null, 2));
  
  const today = new Date();
  today.setHours(0,0,0,0);
  console.log('SEARCHING FROM:', today.toISOString());
  
  const count = await prisma.bill.count({ where: { createdAt: { gte: today } } });
  console.log('BILLS FOUND TODAY:', count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
