import { customerService } from "../services/customerService.js";

// ============================================================================
// CUSTOMER CONTROLLER
// ============================================================================

export const customerController = {
  // Get all customers
  async getAll(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await customerService.findAll(page, limit, req.query);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get customer by ID
  async getById(req, res) {
    try {
      const customer = await customerService.findById(req.params.id);
      res.json(customer);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  // Create customer
  async create(req, res) {
    try {
      const customer = await customerService.create(req.body);
      res.status(201).json(customer);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Update customer
  async update(req, res) {
    try {
      const customer = await customerService.update(req.params.id, req.body);
      res.json(customer);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Delete customer
  async delete(req, res) {
    try {
      await customerService.delete(req.params.id);
      res.json({ message: "Customer deleted" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get customer balance
  async getBalance(req, res) {
    try {
      const balance = await customerService.getBalance(req.params.id);
      res.json(balance);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Search customers by phone (for autocomplete)
  async searchByPhone(req, res) {
    try {
      const customers = await customerService.searchByPhone(req.query.phone);
      res.json(customers);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};
