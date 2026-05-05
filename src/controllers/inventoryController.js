import { inventoryService } from "../services/inventoryService.js";

// ============================================================================
// INVENTORY CONTROLLER
// ============================================================================

export const inventoryController = {
  // Get all items
  async getAll(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await inventoryService.findAll(page, limit, req.query);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get item by ID
  async getById(req, res) {
    try {
      const item = await inventoryService.findById(req.params.id);
      res.json(item);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  // Create item
  async create(req, res) {
    try {
      const item = await inventoryService.create(req.body);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Update item
  async update(req, res) {
    try {
      const item = await inventoryService.update(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Delete item
  async delete(req, res) {
    try {
      await inventoryService.delete(req.params.id);
      res.json({ message: "Inventory item deleted" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get inventory summary
  async getSummary(req, res) {
    try {
      const summary = await inventoryService.getSummary();
      res.json(summary);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get low stock items
  async getLowStock(req, res) {
    try {
      const items = await inventoryService.getLowStockItems();
      res.json(items);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};
