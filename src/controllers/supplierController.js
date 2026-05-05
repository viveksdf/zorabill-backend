import { supplierService } from "../services/supplierService.js";

// ============================================================================
// SUPPLIER CONTROLLER
// ============================================================================

export const supplierController = {
  // Get all suppliers
  async getAll(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await supplierService.findAll(page, limit, req.query);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get supplier by ID
  async getById(req, res) {
    try {
      const supplier = await supplierService.findById(req.params.id);
      res.json(supplier);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  // Create supplier
  async create(req, res) {
    try {
      const supplier = await supplierService.create(req.body);
      res.status(201).json(supplier);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Update supplier
  async update(req, res) {
    try {
      const supplier = await supplierService.update(req.params.id, req.body);
      res.json(supplier);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Delete supplier
  async delete(req, res) {
    try {
      await supplierService.delete(req.params.id);
      res.json({ message: "Supplier deleted" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};
