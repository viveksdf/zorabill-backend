import prisma from "../config/database.js";

// ============================================================================
// SUPPLIER SERVICE
// ============================================================================

export const supplierService = {
  // Get all suppliers with pagination
  async findAll(page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;

    const where = {};
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { phone: { contains: filters.search } },
      ];
    }
    if (filters.status) {
      where.status = filters.status;
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        include: { inventoryItems: { select: { id: true, name: true, sku: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.supplier.count({ where }),
    ]);

    return {
      data: suppliers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  },

  // Get single supplier
  async findById(id) {
    const supplier = await prisma.supplier.findUnique({
      where: { id: parseInt(id) },
      include: { inventoryItems: true, purchaseOrders: { take: 5 } },
    });

    if (!supplier) throw new Error("Supplier not found");
    return supplier;
  },

  // Create supplier
  async create(data) {
    const supplier = await prisma.supplier.create({
      data: {
        name: data.name,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email,
        address: data.address,
        gstNumber: data.gstNumber || null,
        panNumber: data.panNumber || null,
        paymentTerms: data.paymentTerms,
        upiId: data.upiId,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
        bankName: data.bankName,
      },
    });
    return supplier;
  },

  // Update supplier
  async update(id, data) {
    try {
      const updateData = {};
      const fields = [
        "name", "contactPerson", "phone", "email", "address", 
        "gstNumber", "panNumber", "paymentTerms", "status",
        "upiId", "accountNumber", "ifscCode", "bankName"
      ];

      fields.forEach(f => {
        if (data[f] !== undefined) {
          // Special handling for unique fields: convert empty string to null
          if ((f === "gstNumber" || f === "panNumber") && data[f] === "") {
            updateData[f] = null;
          } else {
            updateData[f] = data[f];
          }
        }
      });

      const supplier = await prisma.supplier.update({
        where: { id: parseInt(id) },
        data: updateData,
      });
      return supplier;
    } catch (error) {
      console.error(`Error updating supplier ${id}:`, error);
      throw error;
    }
  },

  // Delete supplier
  async delete(id) {
    await prisma.supplier.delete({
      where: { id: parseInt(id) },
    });
  },
};
