import express from "express";
import { inventoryController } from "../controllers/inventoryController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, inventoryController.getAll);
router.get("/summary", authMiddleware, inventoryController.getSummary);
router.get("/low-stock", authMiddleware, inventoryController.getLowStock);
router.get("/:id", authMiddleware, inventoryController.getById);
router.post("/", authMiddleware, inventoryController.create);
router.patch("/:id", authMiddleware, inventoryController.update);
router.delete("/:id", authMiddleware, inventoryController.delete);

export default router;
