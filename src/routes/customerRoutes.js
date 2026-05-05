import express from "express";
import { customerController } from "../controllers/customerController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, customerController.getAll);
router.get("/search-phone", authMiddleware, customerController.searchByPhone);
router.get("/:id", authMiddleware, customerController.getById);
router.post("/", authMiddleware, customerController.create);
router.patch("/:id", authMiddleware, customerController.update);
router.delete("/:id", authMiddleware, customerController.delete);
router.get("/:id/balance", authMiddleware, customerController.getBalance);

export default router;
