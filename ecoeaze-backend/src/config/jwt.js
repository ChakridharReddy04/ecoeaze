import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET;

const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  console.error("❌ JWT secrets are not set in environment variables");
  // You can choose to throw here to prevent app from starting:
  // throw new Error("JWT secrets missing");
}

/**
 * Sign Access Token
 * payload: { id, role, ... }
 */
export const signAccessToken = (payload, options = {}) => {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    ...options,
  });
};

/**
 * Sign Refresh Token
 */
export const signRefreshToken = (payload, options = {}) => {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    ...options,
  });
};

/**
 * Verify Access Token
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_TOKEN_SECRET);
};

/**
 * Verify Refresh Token
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_TOKEN_SECRET);
};

/**
 * Generate Access + Refresh tokens together
 * user = mongoose user document or plain object
 */
export const generateAuthTokens = (user) => {
  const payload = {
    id: user._id?.toString() || user.id,
    role: user.role,
    email: user.email,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return { accessToken, refreshToken };
};

export default {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateAuthTokens,
};
