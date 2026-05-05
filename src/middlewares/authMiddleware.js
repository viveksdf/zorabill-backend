import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

/**
 * Authentication middleware — validates JWT access token.
 *
 * Extracts the token from the Authorization header (Bearer scheme),
 * verifies it, and attaches the decoded payload to `req.user`.
 *
 * Returns 401 if the token is missing, invalid, or expired.
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token has expired", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ error: "Invalid token", code: "INVALID_TOKEN" });
  }
}
