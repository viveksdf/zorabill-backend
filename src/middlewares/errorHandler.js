// Global error handler middleware
export const errorHandler = (err, req, res, next) => {
  console.error("[ERROR]", err);

  // Prisma known request error
  if (err.code === "P2002") {
    return res.status(409).json({
      error: `Unique constraint failed on field: ${err.meta?.target?.[0] || "unknown"}`,
    });
  }

  // Prisma record not found
  if (err.code === "P2025") {
    return res.status(404).json({ error: "Record not found" });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    error: err.message || "Internal server error",
  });
};

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.path} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};

// 404 handler
export const notFoundHandler = (req, res) => {
  res.status(404).json({ error: "Route not found" });
};
