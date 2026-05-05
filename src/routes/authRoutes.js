import { Router } from "express";
import { register, login, refresh, logout, getMe, changePassword } from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

// Public routes — no auth required
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);

// Protected routes — require valid access token
router.get("/me", authMiddleware, getMe);
router.post("/change-password", authMiddleware, changePassword);

export default router;
