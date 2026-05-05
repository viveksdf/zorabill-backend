import express from "express";
import { supplierController } from "../controllers/supplierController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, supplierController.getAll);
router.get("/:id", authMiddleware, supplierController.getById);
router.post("/", authMiddleware, supplierController.create);
router.patch("/:id", authMiddleware, supplierController.update);
router.delete("/:id", authMiddleware, supplierController.delete);

export default router;
