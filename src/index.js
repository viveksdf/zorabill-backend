import express from "express";
import cors from "cors";
import { config } from "./config/env.js";
import { requestLogger, errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { logger } from "./utils/index.js";
import http from "http";
import { Server } from "socket.io";

BigInt.prototype.toJSON = function () {
  // We convert to a standard Number. 
  // Since you are tracking paise, JS Numbers can safely handle up to ₹90,000 Crores.
  return Number(this); 
};

// Routes
import authRoutes from "./routes/authRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import billRoutes from "./routes/billRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";

const app = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// ============================================================================
// HEALTH CHECK
// ============================================================================
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// ============================================================================
// API ROUTES
// ============================================================================

// Auth Routes (public — no auth middleware)
app.use("/api/auth", authRoutes);

// Dashboard Routes
app.use("/api/dashboard", dashboardRoutes);

// Customers Routes
app.use("/api/customers", customerRoutes);

// Bills Routes
app.use("/api/bills", billRoutes);

// Inventory Routes
app.use("/api/inventory", inventoryRoutes);

// Suppliers Routes
app.use("/api/suppliers", supplierRoutes);

// Analytics Routes
app.use("/api/analytics", analyticsRoutes);

// Settings Routes
app.use("/api/settings", settingsRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================
app.use(notFoundHandler);
app.use(errorHandler);

// ============================================================================
// SOCKET.IO (Remote Scanner)
// ============================================================================
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  // Join a unique session (e.g., specific PC window)
  socket.on("join-session", (sessionId) => {
    socket.join(sessionId);
    logger.info(`📱 Device joined scan session: ${sessionId}`);
  });

  // Receive barcode from mobile and send to PC in same session
  socket.on("scan-result", ({ sessionId, barcode }) => {
    io.to(sessionId).emit("barcode-received", barcode);
    logger.info(`🔍 Barcode [${barcode}] sent to session: ${sessionId}`);
  });
});

// ============================================================================
// START SERVER
// ============================================================================
const PORT = config.port;

server.listen(PORT, "0.0.0.0", () => {
  logger.info(`🚀 Server running on http://0.0.0.0:${PORT}`);
  logger.info(`📦 Environment: ${config.nodeEnv}`);
  logger.info(`🗄️  Database URL configured: ${config.database.url.substring(0, 50)}...`);
});