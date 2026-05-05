import { billService } from "../services/billService.js";

// ============================================================================
// BILL CONTROLLER
// ============================================================================

export const billController = {
  // Get all bills
  async getAll(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 100;
      const result = await billService.findAll(page, limit, req.query);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get bill by ID
  async getById(req, res) {
    try {
      const bill = await billService.findById(req.params.id);
      res.json(bill);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  // Create bill
  async create(req, res) {
    try {
      const bill = await billService.create(req.body);
      res.status(201).json(bill);
    } catch (error) {
      console.log(error);
      // Return user-friendly error, never expose Prisma internals
      const msg = error.code === "P2002"
        ? "A bill with that number already exists"
        : error.code === "P2003"
          ? "Invalid customer or product reference"
          : error.message?.includes("prisma")
            ? "Failed to create bill. Please check your input."
            : error.message || "Failed to create bill";
      res.status(400).json({ error: msg });
    }
  },

  // Update bill
  async update(req, res) {
    try {
      const bill = await billService.update(req.params.id, req.body);
      res.json(bill);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Delete bill
  async delete(req, res) {
    try {
      await billService.delete(req.params.id);
      res.json({ message: "Bill deleted" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get bill by bill code (for returns)
  async getByBillCode(req, res) {
    try {
      const bill = await billService.findByBillCode(req.params.billCode);
      res.json(bill);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  // Get next bill number
  async getNextNumber(req, res) {
    try {
      const billNumber = await billService.getNextBillNumber();
      res.json({ billNumber });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};
