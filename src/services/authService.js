import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pkg from "@prisma/client";
import { config } from "../config/env.js";
import { logger } from "../utils/index.js";
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const { PrismaClient } = pkg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// Pass the adapter to the constructor
const prisma = new PrismaClient({ adapter, log: ["error", "warn"] });

const SALT_ROUNDS = 12;

// ============================================================================
// TOKEN GENERATION
// ============================================================================

/**
 * Generate a JWT access token (short-lived, 5 min default).
 */
export function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiry }
  );
}

/**
 * Generate a JWT refresh token (longer-lived, 30 min default).
 * The token is also stored in the database for server-side validation.
 */
export async function generateRefreshToken(user) {
  const token = jwt.sign(
    { id: user.id, email: user.email },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiry }
  );

  // Calculate expiry date for DB storage
  const decoded = jwt.decode(token);
  const expiresAt = new Date(decoded.exp * 1000);

  // Store in database
  await prisma.refreshToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  return token;
}

/**
 * Generate both access and refresh tokens for a user.
 */
export async function generateTokenPair(user) {
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);
  return { accessToken, refreshToken };
}

// ============================================================================
// REGISTER
// ============================================================================

export async function register({ firstName, lastName, email, phone, password }) {
  // Check if email already exists
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    const error = new Error("A user with this email already exists");
    error.statusCode = 409;
    throw error;
  }

  // Check if phone already exists
  const existingPhone = await prisma.user.findUnique({ where: { phone } });
  if (existingPhone) {
    const error = new Error("A user with this phone number already exists");
    error.statusCode = 409;
    throw error;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
    },
  });

  logger.info(`User registered: ${user.email} (ID: ${user.id})`);

  // Generate token pair
  const tokens = await generateTokenPair(user);

  return {
    user: sanitizeUser(user),
    ...tokens,
  };
}

// ============================================================================
// LOGIN
// ============================================================================

export async function login({ identifier, password }) {
  // identifier can be email or phone
  const isEmail = identifier.includes("@");

  const user = await prisma.user.findUnique({
    where: isEmail ? { email: identifier } : { phone: identifier },
  });

  if (!user) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  if (user.status !== "active") {
    const error = new Error("Account is deactivated");
    error.statusCode = 403;
    throw error;
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  logger.info(`User logged in: ${user.email} (ID: ${user.id})`);

  // Generate token pair
  const tokens = await generateTokenPair(user);

  return {
    user: sanitizeUser(user),
    ...tokens,
  };
}

// ============================================================================
// REFRESH TOKEN (with auto-rotation)
// ============================================================================

export async function refreshToken(token) {
  // 1. Find the refresh token in the database
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!storedToken) {
    const error = new Error("Invalid refresh token");
    error.statusCode = 401;
    throw error;
  }

  // 2. Check if the token has expired in DB
  if (new Date() > storedToken.expiresAt) {
    // Clean up the expired token
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    const error = new Error("Refresh token has expired");
    error.statusCode = 401;
    throw error;
  }

  // 3. Verify JWT signature
  try {
    jwt.verify(token, config.jwt.refreshSecret);
  } catch (err) {
    // Token is invalid — delete it from DB
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    const error = new Error("Invalid refresh token");
    error.statusCode = 401;
    throw error;
  }

  // 4. AUTO-ROTATE: Delete the old refresh token
  await prisma.refreshToken.delete({ where: { id: storedToken.id } });

  logger.info(`Token rotated for user: ${storedToken.user.email} (ID: ${storedToken.user.id})`);

  // 5. Generate a new token pair
  const tokens = await generateTokenPair(storedToken.user);

  return {
    user: sanitizeUser(storedToken.user),
    ...tokens,
  };
}

// ============================================================================
// LOGOUT
// ============================================================================

export async function logout(token) {
  if (!token) return;

  try {
    await prisma.refreshToken.deleteMany({ where: { token } });
    logger.info("Refresh token deleted on logout");
  } catch (err) {
    // Token may already be deleted — that's fine
    logger.warn("Attempted to delete non-existent refresh token on logout");
  }
}

// ============================================================================
// GET CURRENT USER
// ============================================================================

export async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return sanitizeUser(user);
}

// ============================================================================
// CLEANUP EXPIRED TOKENS
// ============================================================================

export async function cleanupExpiredTokens() {
  const result = await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  if (result.count > 0) {
    logger.info(`Cleaned up ${result.count} expired refresh tokens`);
  }
}

// ============================================================================
// CHANGE PASSWORD
// ============================================================================

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    const error = new Error("Incorrect current password");
    error.statusCode = 401;
    throw error;
  }

  // Hash and save new password
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });

  logger.info(`Password changed for user ID: ${userId}`);
}

// ============================================================================
// HELPERS
// ============================================================================

function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}
