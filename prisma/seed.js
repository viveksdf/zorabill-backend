import 'dotenv/config';
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// Pass the adapter to the constructor
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Clearing database before seeding...");
  await prisma.billItem.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();

  console.log("🌱 Seeding database with sample data...");

  // Seed Suppliers
  const suppliers = await prisma.supplier.createMany({
    data: [
      {
        name: "AgroBridge Wholesalers",
        contactPerson: "Mahesh Kumar",
        phone: "9811122334",
        email: "mahesh@agrobridge.com",
        address: "Industrial Area, Tumkur Rd, Bengaluru",
        gstNumber: "29AAABM4321H1Z4",
        paymentTerms: "Net 30",
      },
      {
        name: "Dairy Fresh Pvt Ltd",
        contactPerson: "Sunita Reddy",
        phone: "9922233445",
        email: "sunita@dairyfresh.in",
        address: "Yelahanka, Bengaluru",
        gstNumber: "29AABCD3456F1Z5",
        paymentTerms: "Net 15",
      },
      {
        name: "Metro Consumer Goods",
        contactPerson: "Rajiv Pillai",
        phone: "9933344556",
        email: "rajiv@metrocg.com",
        address: "Peenya, Bengaluru",
        gstNumber: "29AACDE5678G2Z6",
        paymentTerms: "Immediate",
      },
    ],
  });

  console.log(`✅ Created ${suppliers.count} suppliers`);

  // Seed Customers
  const customers = await prisma.customer.createMany({
    data: [
      {
        name: "Ravi Sharma",
        phone: "9876543210",
        email: "ravi@gmail.com",
        address: "12, MG Road, Bengaluru",
        gstNumber: "29AADCB2230M1ZP",
        panNumber: "AADCB2230M",
      },
      {
        name: "Priya Mehta",
        phone: "9845012345",
        email: "priya@mehta.in",
        address: "5, Koramangala, Bengaluru",
        panNumber: "BKNPM3392F",
      },
      {
        name: "Suresh Nair",
        phone: "9900112233",
        address: "7, Indiranagar, Bengaluru",
        gstNumber: "32ABCDE1234F1Z5",
      },
      {
        name: "Ananya Rao",
        phone: "9123456789",
        email: "ananya@rao.com",
        address: "3, Jayanagar, Bengaluru",
        panNumber: "CQQPR4567T",
      },
      {
        name: "Kiran Patel",
        phone: "9000099000",
        email: "kiran@patelsupply.com",
        address: "22, Whitefield, Bengaluru",
        gstNumber: "24AAACF2222B1Z5",
        panNumber: "AAACF2222B",
      },
    ],
  });

  console.log(`✅ Created ${customers.count} customers`);

  // Seed Inventory Items
  const dbSuppliers = await prisma.supplier.findMany({ take: 1, orderBy: { id: 'desc' } });
  const supplierId = dbSuppliers.length > 0 ? dbSuppliers[0].id : 1;

  const CATEGORIES = ["Groceries", "Dairy", "Beverages", "Personal Care", "Household", "Electronics", "Hardware", "Others"];
  const UNITS = ["pcs", "kg", "g", "ltr", "ml", "box", "pkt", "dz"];
  const PRODUCT_MAP = {
    "Groceries": ["Premium Basmati Rice", "Whole Wheat Atta", "Toor Dal", "Moong Dal", "Turmeric Powder", "Red Chilli Powder", "Refined Sunflower Oil", "Mustard Oil", "Tata Salt", "Sugar Crystal", "Poha", "Suji", "Besan", "Peanuts", "Cashews", "Almonds", "Green Cardamom", "Clove", "Black Pepper", "Cumin Seeds"],
    "Dairy": ["Full Cream Milk", "Toned Milk", "Fresh Paneer", "Salted Butter", "Plain Curd", "Greek Yogurt", "Cheese Slices", "Cheese Block", "Ghee", "Dairy Whitener", "Condensed Milk", "Milkshake Chocolate", "Milkshake Strawberry", "Buttermilk", "Lassi"],
    "Beverages": ["Assam Tea Leaves", "Instant Coffee Powder", "Green Tea Bags", "Orange Juice 1L", "Apple Juice 1L", "Mixed Fruit Juice", "Cola Soft Drink", "Lemon Soda", "Energy Drink", "Mineral Water 500ml", "Mineral Water 1L", "Tender Coconut Water", "Tomato Juice"],
    "Personal Care": ["Bathing Soap Neem", "Sandalwood Soap", "Anti-Dandruff Shampoo", "Hair Conditioner", "Herbal Toothpaste", "Mouthwash", "Shaving Cream", "Disposable Razors", "Face Wash", "Moisturizing Cream", "Sunscreen Lotion", "Talcum Powder", "Deodorant Spray", "Hand Wash"],
    "Household": ["Dishwash Bar", "Dishwash Liquid", "Floor Cleaner", "Glass Cleaner", "Laundry Detergent Powder", "Liquid Detergent", "Toilet Cleaner", "Scrub Pad", "Garbage Bags", "Air Freshener Spray", "Napkins", "Kitchen Towels", "Broom Stick", "Mop Cloth"],
    "Electronics": ["LED Bulb 9W", "LED Bulb 12W", "AA Battery 4-pack", "AAA Battery 4-pack", "Extension Board", "Mobile Charging Cable", "USB Wall Adapter", "Earphones with Mic", "Wireless Mouse", "Keyboard USB", "Calculators", "Electric Kettle", "Iron Box"],
    "Hardware": ["Screwdriver Set", "Steel Hammer", "Measuring Tape 5m", "PVC Tape Blue", "Fastening Nails 1 inch", "Nuts and Bolts M8", "Padlock Large", "Door Hinges Steel", "Paint Brush 2 inch", "Wall Primer 1L", "White Cement 1kg", "Adhesive Tube", "WD-40 Spray"],
    "Others": ["Notebook A4 Size", "Ballpoint Pens Blue", "HB Pencil Set", "Geometry Box", "Correction Tape", "Sticky Notes", "Cardboard Box Small", "Shipping Tape", "Plastic Ruler", "Office Stapler", "Paper Clips Box"]
  };

  const items = [];
  const totalToGenerate = 1000;

  for (let i = 1; i <= totalToGenerate; i++) {
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const productBaseNames = PRODUCT_MAP[category] || ["General Product"];
    const baseName = productBaseNames[Math.floor(Math.random() * productBaseNames.length)];
    const name = `${baseName} - Batch ${Math.ceil(i / productBaseNames.length)}`;
    const sku = `SKU-${i.toString().padStart(4, '0')}`;
    const unit = UNITS[Math.floor(Math.random() * UNITS.length)];
    
    let taxRate = 18;
    let taxType = "GST";
    if (category === "Electronics" || category === "Hardware") {
      taxRate = Math.random() > 0.5 ? 18 : 28;
    } else if (category === "Groceries") {
      taxRate = 5;
    }

    const purchasePrice = BigInt(Math.floor(Math.random() * 50000) + 1000);
    const sellingPrice = purchasePrice + BigInt(Math.floor(Number(purchasePrice) * (Math.random() * 0.3 + 0.1)));

    const currentQty = parseFloat((Math.random() * 200 + 10).toFixed(2));
    const lowStock = parseFloat((Math.random() * 20 + 5).toFixed(2));

    items.push({
      name, sku, category, unit, purchasePrice, sellingPrice,
      currentQuantity: currentQty, totalQuantity: currentQty,
      lowStockThreshold: lowStock, taxRate, taxType, supplierId,
      location: "Rack-" + Math.floor(Math.random() * 50),
    });

    if (items.length >= 200) {
      await prisma.inventoryItem.createMany({ data: items });
      items.length = 0;
    }
  }

  // Add 14 special expiry items (2 years from now)
  const twoYearsFromNow = new Date();
  twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);

  const expiryItems = [
    "Milk 1L", "Curd 500g", "Butter 200g", "Paneer 200g", "Cream 250ml",
    "Bread 400g", "Jam 500g", "Sauce 1kg", "Juice 1L", "Soda 2L",
    "Coffee 100g", "Tea 500g", "Honey 250g", "Oats 1kg"
  ].map((n, i) => ({
    name: n + " (Future Expiry)",
    sku: `FEXP-${i+1}`,
    category: i < 5 ? "Dairy" : i < 10 ? "Groceries" : "Beverages",
    unit: "pcs",
    purchasePrice: 5000n,
    sellingPrice: 7000n,
    currentQuantity: 50,
    totalQuantity: 50,
    lowStockThreshold: 10,
    taxRate: 12,
    taxType: "GST",
    expiryDate: twoYearsFromNow,
    supplierId
  }));

  // Add 6 items specifically for "Expiring Soon" testing (10 days from now)
  const tenDaysFromNow = new Date();
  tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);

  const expiringSoonItems = [
    "Fresh Yogurt 200g", "Brown Bread 400g", "Toned Milk 500ml",
    "Soya Milk 1L", "Fresh Tofu 200g", "Fruit Salad Box"
  ].map((n, i) => ({
    name: n + " (Expiring Soon)",
    sku: `SOON-${i+1}`,
    category: "Dairy",
    unit: "pcs",
    purchasePrice: 3000n,
    sellingPrice: 4500n,
    currentQuantity: 20,
    totalQuantity: 20,
    lowStockThreshold: 5,
    taxRate: 5,
    taxType: "GST",
    expiryDate: tenDaysFromNow,
    supplierId
  }));

  items.push(...expiryItems, ...expiringSoonItems);

  if (items.length > 0) {
    await prisma.inventoryItem.createMany({ data: items });
  }

  console.log(`✅ Created 1020 inventory items total`);

  // --- SEED CUSTOMERS (Expanded) ---
  const firstNames = ["Aravind", "Arjun", "Abhishek", "Aditya", "Amit", "Anjali", "Ananya", "Deepak", "Gaurav", "Harish", "Ishaan", "Jyoti", "Kavita", "Lokesh", "Manoj", "Naveen", "Pooja", "Rahul", "Sandeep", "Sneha", "Tanvi", "Umesh", "Vikram", "Yash", "Zoya", "Bala", "Chitra", "Divya", "Eswar", "Farhan", "Gita", "Hema", "Indira", "Jaya", "Kiran", "Lata", "Madhav", "Nandini", "Omkar", "Pranav", "Rina", "Sita", "Tara", "Usha", "Vani", "Waman", "Xavier", "Yamini", "Zahir"];
  const lastNames = ["Sharma", "Verma", "Gupta", "Singh", "Patel", "Reddy", "Nair", "Pillai", "Iyer", "Chaudhary", "Yadav", "Kumar", "Rao", "Mehta", "Joshi", "Desai", "Malhotra", "Kapoor", "Khan", "Das", "Bose", "Dutta", "Chatterjee", "Mukherjee", "Banerjee", "Ghosal", "Sarkar", "Sen", "Roy", "Basu", "Majumdar", "Haldar", "Pal", "Bagchi", "Sanyal", "Bhattacharya", "Chakraborty", "Ganguly", "Sinha", "Mishra", "Pandey", "Tiwari", "Dubey", "Shukla", "Agrawal", "Bansal", "Goel", "Mittal", "Singhal"];

  const customerData = [];
  for (let i = 0; i < 100; i++) {
    const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    // Generate realistic GST and PAN
    const pan = (Math.random().toString(36).substring(2, 7) + Math.floor(1000 + Math.random() * 9000) + Math.random().toString(36).substring(2, 3)).toUpperCase();
    const gst = "29" + pan + "1Z" + Math.floor(Math.random() * 9);

    customerData.push({
      name: `${fName} ${lName}`,
      phone: (7000000000 + Math.floor(Math.random() * 2999999999)).toString(),
      email: `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@example.in`,
      address: `${Math.floor(Math.random() * 100)}, Landmark St, Area ${i % 10}, City`,
      gstNumber: Math.random() > 0.4 ? gst : null,
      panNumber: Math.random() > 0.3 ? pan : null,
    });
  }
  await prisma.customer.createMany({ data: customerData });
  const dbCustomers = await prisma.customer.findMany();
  console.log(`✅ Created ${dbCustomers.length} Indian customers`);

  // --- SEED BILLS (1500) ---
  console.log("🌱 Generating 1,500 bills over the last year...");
  const dbInventory = await prisma.inventoryItem.findMany({ take: 200 });
  const totalBillsToGenerate = 1500;
  
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  for (let i = 1; i <= totalBillsToGenerate; i++) {
    const customer = dbCustomers[Math.floor(Math.random() * dbCustomers.length)];
    const billDate = new Date(oneYearAgo.getTime() + Math.random() * (today.getTime() - oneYearAgo.getTime()));
    
    const rand = Math.random();
    let status = "paid"; // 60%
    if (rand > 0.6 && rand <= 0.7) status = "unpaid"; // 10%
    else if (rand > 0.7 && rand <= 0.9) status = "partial"; // 20%
    else if (rand > 0.9) status = "quotation"; // 10%

    const billNumber = `INV-${billDate.getFullYear()}-${i.toString().padStart(4, '0')}`;
    const billCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const numItems = Math.floor(Math.random() * 4) + 1;
    const billItems = [];
    let subtotal = 0n;
    
    for (let j = 0; j < numItems; j++) {
      const invItem = dbInventory[Math.floor(Math.random() * dbInventory.length)];
      const qty = Math.floor(Math.random() * 5) + 1;
      const unitPrice = invItem.sellingPrice;
      const lineSubtotal = unitPrice * BigInt(qty);
      
      billItems.push({
        inventoryItemId: invItem.id,
        itemName: invItem.name,
        quantity: parseFloat(qty.toFixed(2)),
        unitPrice: unitPrice,
        discount: 0,
        taxRate: invItem.taxRate,
        taxType: invItem.taxType,
        subtotal: lineSubtotal,
        createdAt: billDate
      });
      subtotal += lineSubtotal;
    }

    const taxAmount = (subtotal * 18n) / 100n;
    const totalAmount = subtotal + taxAmount;
    
    let paidAmount = 0n;
    let dueDate = null;
    if (status === "paid") {
      paidAmount = totalAmount;
      dueDate = billDate;
    } else if (status === "partial") {
      paidAmount = (totalAmount * BigInt(Math.floor(Math.random() * 50) + 10)) / 100n;
      dueDate = new Date(billDate.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days later
    } else if (status === "unpaid") {
      paidAmount = 0n;
      dueDate = new Date(billDate.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days later
    } else if (status === "quotation") {
      paidAmount = 0n;
    }

    await prisma.bill.create({
      data: {
        billNumber, billCode, customerId: customer.id, customerName: customer.name,
        subtotal, taxAmount, totalAmount, paidAmount, status,
        dueDate,
        createdAt: billDate, updatedAt: billDate,
        items: {
          create: billItems.map(item => ({
            inventoryItemId: item.inventoryItemId,
            itemName: item.itemName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            taxRate: item.taxRate,
            taxType: item.taxType,
            subtotal: item.subtotal,
            createdAt: item.createdAt
          }))
        }
      }
    });

    if (i % 300 === 0) console.log(`...processed ${i} bills`);
  }

  console.log(`✅ Seeded 1,500 bills with Indian customer profiles`);
  console.log("✨ Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
