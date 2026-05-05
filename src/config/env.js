import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  logLevel: process.env.LOG_LEVEL || "info",
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || "default-jwt-secret",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "default-refresh-secret",
    expiry: process.env.JWT_EXPIRY || "5m",
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || "30m",
  },
};

if (!config.database.url) {
  throw new Error("DATABASE_URL environment variable is not set");
}
