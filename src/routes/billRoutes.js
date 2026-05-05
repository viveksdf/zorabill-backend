import express from "express";
import { billController } from "../controllers/billController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, billController.getAll);
router.get("/next-number", authMiddleware, billController.getNextNumber);
router.get("/code/:billCode", authMiddleware, billController.getByBillCode);
router.get("/:id", authMiddleware, billController.getById);
router.post("/", authMiddleware, billController.create);
router.patch("/:id", authMiddleware, billController.update);
router.delete("/:id", authMiddleware, billController.delete);

export default router;
