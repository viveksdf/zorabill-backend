import prisma from '../src/config/database.js';

async function main() {
  console.log('🚀 Starting 90-day Data Simulation...');

  // 1. Get current inventory
  const items = await prisma.inventoryItem.findMany();
  if (items.length === 0) {
    console.error('❌ No inventory items found. Please add items first.');
    return;
  }

  // 2. Get existing customers or create a dummy pool
  let customers = await prisma.customer.findMany();
  if (customers.length === 0) {
    console.log('📝 No customers found. Creating a pool of 10 customers...');
    for (const name of [
      'Rajesh Khanna', 'Priya Sharma', 'Amit Patel', 'Suresh Kumar', 'Anjali Devi',
      'Vikram Singh', 'Kavita Reddy', 'Manoj Bajpayee', 'Sneha Gupta', 'Rohan Mehta'
    ]) {
      await prisma.customer.create({
        data: {
          name,
          phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
          email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
          address: 'Main Street, Sector 5, India'
        }
      });
    }
    customers = await prisma.customer.findMany();
  }

  const today = new Date();
  let billCounter = 50; // Offset to avoid collisions

  // Loop back 90 days
  for (let i = 90; i >= 0; i--) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() - i);
    
    if (i === 0) continue;

    const dailyBills = Math.floor(Math.random() * 4);
    console.log(`📅 Processing ${targetDate.toLocaleDateString()} - Generating ${dailyBills} bills...`);

    for (let j = 0; j < dailyBills; j++) {
      const billDate = new Date(targetDate);
      billDate.setHours(Math.floor(Math.random() * 12) + 9, Math.floor(Math.random() * 60));

      const customer = customers[Math.floor(Math.random() * customers.length)];
      const status = Math.random() > 0.3 ? 'paid' : 'unpaid';
      const billNumber = `INV-H-${(billCounter++).toString().padStart(5, '0')}`;
      const billCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Random items for this bill
      const numItems = Math.floor(Math.random() * 3) + 1;
      const selectedItems = [];
      let subtotal = 0n;

      for (let k = 0; k < numItems; k++) {
        const item = items[Math.floor(Math.random() * items.length)];
        const qty = Math.floor(Math.random() * 5) + 1;
        const lineTotal = BigInt(qty) * item.sellingPrice;
        
        selectedItems.push({
          inventoryItemId: item.id,
          itemName: item.name,
          quantity: qty,
          unitPrice: item.sellingPrice,
          discount: 0,
          taxRate: 18,
          subtotal: lineTotal
        });
        subtotal += lineTotal;
      }

      const taxAmount = (subtotal * 18n) / 100n;
      const totalAmount = subtotal + taxAmount;

      // Create the Bill
      await prisma.bill.create({
        data: {
          billNumber,
          billCode,
          customerId: customer.id,
          customerName: customer.name,
          subtotal,
          taxAmount,
          totalAmount,
          status,
          paidDate: status === 'paid' ? billDate : null,
          createdAt: billDate,
          updatedAt: billDate,
          items: {
            create: selectedItems
          }
        }
      });
    }
  }

  console.log('✅ 90-day Simulation Complete!');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
