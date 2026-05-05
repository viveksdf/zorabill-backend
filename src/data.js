// In-memory dummy data store — simulates what your DB would return

export const db = {
  customers: [
    { id: 1, name: "Ravi Sharma", phone: "9876543210", email: "ravi@gmail.com", address: "12, MG Road, Bengaluru", gstNumber: "29AADCB2230M1ZP", panNumber: "AADCB2230M", creditLimit: 50000, totalBilled: 125000, totalPaid: 110000, createdAt: "2024-07-15T10:00:00.000Z" },
    { id: 2, name: "Priya Mehta",  phone: "9845012345", email: "priya@mehta.in",  address: "5, Koramangala, Bengaluru", gstNumber: null, panNumber: "BKNPM3392F", creditLimit: 30000, totalBilled: 87500, totalPaid: 87500, createdAt: "2024-08-02T09:30:00.000Z" },
    { id: 3, name: "Suresh Nair",  phone: "9900112233", email: null, address: "7, Indiranagar, Bengaluru", gstNumber: "32ABCDE1234F1Z5", panNumber: null, creditLimit: null, totalBilled: 54000, totalPaid: 30000, createdAt: "2024-09-10T11:15:00.000Z" },
    { id: 4, name: "Ananya Rao",   phone: "9123456789", email: "ananya@rao.com",  address: "3, Jayanagar, Bengaluru", gstNumber: null, panNumber: "CQQPR4567T", creditLimit: 20000, totalBilled: 32000, totalPaid: 32000, createdAt: "2024-10-05T08:00:00.000Z" },
    { id: 5, name: "Kiran Patel",  phone: "9000099000", email: "kiran@patelsupply.com", address: "22, Whitefield, Bengaluru", gstNumber: "24AAACF2222B1Z5", panNumber: "AAACF2222B", creditLimit: 100000, totalBilled: 210000, totalPaid: 195000, createdAt: "2024-06-20T07:45:00.000Z" },
  ],

  inventory: [
    { id: 1, name: "Basmati Rice 1kg",    sku: "GRO-001", category: "Groceries", location: "Rack A-1", unit: "kg",  purchasePrice: 80,  sellingPrice: 110,  currentQuantity: 250, totalQuantity: 500, lowStockThreshold: 50,  taxRate: 5,  hsnCode: "1006", expiryDate: "2025-12-31", supplierId: 1, createdAt: "2024-07-01T00:00:00.000Z" },
    { id: 2, name: "Toor Dal 500g",        sku: "GRO-002", category: "Groceries", location: "Rack A-2", unit: "kg",  purchasePrice: 90,  sellingPrice: 120,  currentQuantity: 8,   totalQuantity: 200, lowStockThreshold: 20,  taxRate: 5,  hsnCode: "0713", expiryDate: "2025-10-15", supplierId: 1, createdAt: "2024-07-01T00:00:00.000Z" },
    { id: 3, name: "Sunflower Oil 1L",     sku: "GRO-003", category: "Groceries", location: "Rack B-1", unit: "ltr", purchasePrice: 130, sellingPrice: 165,  currentQuantity: 60,  totalQuantity: 150, lowStockThreshold: 15,  taxRate: 5,  hsnCode: "1512", expiryDate: "2025-08-20", supplierId: 1, createdAt: "2024-07-02T00:00:00.000Z" },
    { id: 4, name: "Aashirvaad Atta 5kg",  sku: "GRO-004", category: "Groceries", location: "Rack A-3", unit: "pkg", purchasePrice: 220, sellingPrice: 275,  currentQuantity: 5,   totalQuantity: 100, lowStockThreshold: 10,  taxRate: 5,  hsnCode: "1101", expiryDate: "2025-06-30", supplierId: 1, createdAt: "2024-07-03T00:00:00.000Z" },
    { id: 5, name: "Amul Butter 500g",     sku: "DAI-001", category: "Dairy",     location: "Fridge-1", unit: "pkg", purchasePrice: 220, sellingPrice: 255,  currentQuantity: 30,  totalQuantity: 80,  lowStockThreshold: 10,  taxRate: 12, hsnCode: "0405", expiryDate: "2025-05-15", supplierId: 2, createdAt: "2024-07-05T00:00:00.000Z" },
    { id: 6, name: "Surf Excel 1kg",       sku: "HOM-001", category: "Home Care", location: "Rack C-2", unit: "kg",  purchasePrice: 150, sellingPrice: 198,  currentQuantity: 45,  totalQuantity: 100, lowStockThreshold: 12,  taxRate: 18, hsnCode: "3402", expiryDate: null,           supplierId: 3, createdAt: "2024-07-06T00:00:00.000Z" },
    { id: 7, name: "Colgate Toothpaste",   sku: "PER-001", category: "Personal",  location: "Rack D-1", unit: "pcs", purchasePrice: 55,  sellingPrice: 72,   currentQuantity: 120, totalQuantity: 300, lowStockThreshold: 30,  taxRate: 18, hsnCode: "3306", expiryDate: "2026-03-01", supplierId: 3, createdAt: "2024-07-07T00:00:00.000Z" },
    { id: 8, name: "Maggi 12pk",           sku: "GRO-005", category: "Groceries", location: "Rack B-3", unit: "pkg", purchasePrice: 140, sellingPrice: 168,  currentQuantity: 3,   totalQuantity: 60,  lowStockThreshold: 10,  taxRate: 5,  hsnCode: "1902", expiryDate: "2025-09-30", supplierId: 1, createdAt: "2024-07-08T00:00:00.000Z" },
  ],

  suppliers: [
    { id: 1, name: "AgroBridge Wholesalers", contactPerson: "Mahesh Kumar",  phone: "9811122334", email: "mahesh@agrobridge.com", address: "Industrial Area, Tumkur Rd, Bengaluru", gstNumber: "29AAABM4321H1Z4", paymentTerms: "Net 30", createdAt: "2024-06-01T00:00:00.000Z" },
    { id: 2, name: "Dairy Fresh Pvt Ltd",    contactPerson: "Sunita Reddy",   phone: "9922233445", email: "sunita@dairyfresh.in",    address: "Yelahanka, Bengaluru", gstNumber: "29AABCD3456F1Z5", paymentTerms: "Net 15", createdAt: "2024-06-05T00:00:00.000Z" },
    { id: 3, name: "Metro Consumer Goods",   contactPerson: "Rajiv Pillai",   phone: "9933344556", email: "rajiv@metrocg.com",        address: "Peenya, Bengaluru", gstNumber: "29AACDE5678G2Z6", paymentTerms: "Immediate", createdAt: "2024-06-10T00:00:00.000Z" },
  ],

  bills: [
    {
      id: 1, billNumber: "INV-0001", customerId: 1, customerName: "Ravi Sharma", status: "paid",
      subtotal: 2200, discountAmount: 110, taxAmount: 104.5, totalAmount: 2194.5,
      notes: "Thank you for your business!", dueDate: "2025-03-15", createdAt: "2025-03-01T10:00:00.000Z",
      items: [
        { id: 1, inventoryItemId: 1, itemName: "Basmati Rice 1kg", quantity: 10, unitPrice: 110, discount: 5, taxRate: 5, subtotal: 1044.75 },
        { id: 2, inventoryItemId: 6, itemName: "Surf Excel 1kg",   quantity: 5,  unitPrice: 198, discount: 5, taxRate: 18, subtotal: 1149.75 },
      ]
    },
    {
      id: 2, billNumber: "INV-0002", customerId: 2, customerName: "Priya Mehta", status: "paid",
      subtotal: 1870, discountAmount: 0, taxAmount: 93.5, totalAmount: 1963.5,
      notes: null, dueDate: "2025-03-20",  createdAt: "2025-03-05T14:00:00.000Z",
      items: [
        { id: 3, inventoryItemId: 3, itemName: "Sunflower Oil 1L", quantity: 6, unitPrice: 165, discount: 0, taxRate: 5, subtotal: 1039.5 },
        { id: 4, inventoryItemId: 5, itemName: "Amul Butter 500g", quantity: 4, unitPrice: 255, discount: 0, taxRate: 12, subtotal: 1140 },
      ]
    },
    {
      id: 3, billNumber: "INV-0003", customerId: 3, customerName: "Suresh Nair", status: "unpaid",
      subtotal: 3200, discountAmount: 160, taxAmount: 144, totalAmount: 3184,
      notes: "Payment due by month end.", dueDate: "2025-04-10", createdAt: "2025-03-12T09:30:00.000Z",
      items: [
        { id: 5, inventoryItemId: 7, itemName: "Colgate Toothpaste", quantity: 20, unitPrice: 72, discount: 5, taxRate: 18, subtotal: 1609.2 },
        { id: 6, inventoryItemId: 4, itemName: "Aashirvaad Atta 5kg", quantity: 5, unitPrice: 275, discount: 5, taxRate: 5, subtotal: 1374.4 },
      ]
    },
    {
      id: 4, billNumber: "INV-0004", customerId: 5, customerName: "Kiran Patel", status: "paid",
      subtotal: 5040, discountAmount: 252, taxAmount: 238.6, totalAmount: 5026.6,
      notes: "Bulk order discount applied.", dueDate: "2025-03-25", createdAt: "2025-03-18T11:00:00.000Z",
      items: [
        { id: 7, inventoryItemId: 1, itemName: "Basmati Rice 1kg",  quantity: 20, unitPrice: 110, discount: 5, taxRate: 5, subtotal: 2090 },
        { id: 8, inventoryItemId: 2, itemName: "Toor Dal 500g",      quantity: 15, unitPrice: 120, discount: 5, taxRate: 5, subtotal: 1710 },
        { id: 9, inventoryItemId: 8, itemName: "Maggi 12pk",         quantity: 10, unitPrice: 168, discount: 5, taxRate: 5, subtotal: 1596 },
      ]
    },
    {
      id: 5, billNumber: "INV-0005", customerId: 4, customerName: "Ananya Rao", status: "unpaid",
      subtotal: 1440, discountAmount: 0, taxAmount: 72, totalAmount: 1512,
      notes: null, dueDate: "2025-04-20", createdAt: "2025-03-22T15:30:00.000Z",
      items: [
        { id: 10, inventoryItemId: 1, itemName: "Basmati Rice 1kg", quantity: 8, unitPrice: 110, discount: 0, taxRate: 5, subtotal: 924 },
        { id: 11, inventoryItemId: 3, itemName: "Sunflower Oil 1L", quantity: 3, unitPrice: 165, discount: 0, taxRate: 5, subtotal: 519.75 },
      ]
    },
  ],

  settings: {
    shopName: "VyaparBook Store",
    invoicePrefix: "INV",
    currency: "INR",
    taxRate: 18,
    phone: "9876500000",
    email: "store@vyaparbook.com",
    address: "10, Brigade Road, Bengaluru - 560001",
    gstNumber: "29XXXXX1234Z",
  },
};

// Computed helpers
export function formatCustomer(c) {
  return {
    ...c,
    outstandingBalance: c.totalBilled - c.totalPaid,
  };
}
