import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import {
  isAccountLocked,
  recordFailedLogin,
  clearFailedLogins,
  getLockoutTimeRemaining,
} from '../middleware/security';

const prisma = new PrismaClient();

// Constants
const SALT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRY = '1h'; // 1 hour
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
const RESET_TOKEN_EXPIRY_HOURS = 1;

// JWT payload interface
interface JWTPayload {
  userId: string;
  email: string;
}

// Token pair interface
interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Get JWT secret from environment
 * Throws error if not configured
 */
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }
  return secret;
}

/**
 * Hash a password using bcrypt
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hashed password
 * @param password Plain text password
 * @param hashedPassword Hashed password from database
 * @returns True if passwords match
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Generate JWT access and refresh tokens
 * @param userId User ID
 * @param email User email
 * @returns Token pair (access and refresh tokens)
 */
export function generateTokens(userId: string, email: string): TokenPair {
  const secret = getJWTSecret();
  
  const payload: JWTPayload = { userId, email };
  
  const accessToken = jwt.sign(payload, secret, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
  
  const refreshToken = jwt.sign(payload, secret, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
  
  return { accessToken, refreshToken };
}

/**
 * Verify a JWT token
 * @param token JWT token to verify
 * @returns Decoded payload if valid
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): JWTPayload {
  const secret = getJWTSecret();
  return jwt.verify(token, secret) as JWTPayload;
}

/**
 * Generate a password reset token
 * @returns Reset token string
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Register a new user
 * @param email User email
 * @param password User password
 * @param name Optional user name
 * @returns Created user (without password) and tokens
 */
export async function registerUser(
  email: string,
  password: string,
  name?: string
) {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  
  if (existingUser) {
    throw new Error('User with this email already exists');
  }
  
  // Hash password
  const hashedPassword = await hashPassword(password);
  
  // Generate tokens
  const tempUserId = crypto.randomUUID();
  const tokens = generateTokens(tempUserId, email);
  
  // Calculate refresh token expiry
  const refreshTokenExpiry = new Date();
  refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);
  
  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: name || null,
      emailVerified: false,
      refreshToken: tokens.refreshToken,
      refreshTokenExpiry,
    },
  });
  
  // Generate new tokens with actual user ID
  const actualTokens = generateTokens(user.id, user.email!);
  
  // Update user with actual refresh token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshToken: actualTokens.refreshToken,
    },
  });
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  
  return {
    user: userWithoutPassword,
    tokens: actualTokens,
  };
}

/**
 * Login a user with email and password
 * @param email User email
 * @param password User password
 * @returns User (without password) and tokens
 */
export async function loginUser(email: string, password: string) {
  // Check if account is locked
  if (isAccountLocked(email)) {
    const remainingMinutes = getLockoutTimeRemaining(email);
    throw new Error(
      `Account is temporarily locked due to too many failed login attempts. Please try again in ${remainingMinutes} minutes.`
    );
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });
  
  if (!user || !user.password) {
    recordFailedLogin(email);
    throw new Error('Invalid email or password');
  }
  
  // Verify password
  const isPasswordValid = await comparePassword(password, user.password);
  
  if (!isPasswordValid) {
    recordFailedLogin(email);
    throw new Error('Invalid email or password');
  }

  // Clear failed login attempts on successful login
  clearFailedLogins(email);
  
  // Generate tokens
  const tokens = generateTokens(user.id, user.email!);
  
  // Calculate refresh token expiry
  const refreshTokenExpiry = new Date();
  refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);
  
  // Update user with refresh token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshToken: tokens.refreshToken,
      refreshTokenExpiry,
    },
  });
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  
  return {
    user: userWithoutPassword,
    tokens,
  };
}

/**
 * Refresh access token using refresh token
 * @param refreshToken Refresh token
 * @returns New token pair
 */
export async function refreshAccessToken(refreshToken: string) {
  // Verify refresh token
  let payload: JWTPayload;
  try {
    payload = verifyToken(refreshToken);
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
  
  // Find user and verify refresh token matches
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });
  
  if (!user || user.refreshToken !== refreshToken) {
    throw new Error('Invalid refresh token');
  }
  
  // Check if refresh token is expired
  if (user.refreshTokenExpiry && user.refreshTokenExpiry < new Date()) {
    throw new Error('Refresh token has expired');
  }
  
  // Generate new tokens
  const tokens = generateTokens(user.id, user.email!);
  
  // Calculate new refresh token expiry
  const refreshTokenExpiry = new Date();
  refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);
  
  // Update user with new refresh token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshToken: tokens.refreshToken,
      refreshTokenExpiry,
    },
  });
  
  return tokens;
}

/**
 * Logout a user by invalidating refresh token
 * @param userId User ID
 */
export async function logoutUser(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      refreshToken: null,
      refreshTokenExpiry: null,
    },
  });
}

/**
 * Initiate password reset by generating reset token
 * @param email User email
 * @returns Reset token (to be sent via email)
 */
export async function initiatePasswordReset(email: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  
  if (!user) {
    // Don't reveal if user exists for security
    throw new Error('If a user with this email exists, a reset link has been sent');
  }
  
  // Generate reset token
  const resetToken = generateResetToken();
  
  // Calculate expiry (1 hour from now)
  const resetTokenExpiry = new Date();
  resetTokenExpiry.setHours(resetTokenExpiry.getHours() + RESET_TOKEN_EXPIRY_HOURS);
  
  // Save reset token to database
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken,
      resetTokenExpiry,
    },
  });
  
  return resetToken;
}

/**
 * Reset password using reset token
 * @param resetToken Reset token
 * @param newPassword New password
 */
export async function resetPassword(
  resetToken: string,
  newPassword: string
): Promise<void> {
  // Find user by reset token
  const user = await prisma.user.findFirst({
    where: {
      resetToken,
      resetTokenExpiry: {
        gte: new Date(), // Token must not be expired
      },
    },
  });
  
  if (!user) {
    throw new Error('Invalid or expired reset token');
  }
  
  // Hash new password
  const hashedPassword = await hashPassword(newPassword);
  
  // Update user password and clear reset token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });
}

/**
 * Change user password (when logged in)
 * @param userId User ID
 * @param currentPassword Current password
 * @param newPassword New password
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  // Find user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  
  if (!user || !user.password) {
    throw new Error('User not found');
  }
  
  // Verify current password
  const isPasswordValid = await comparePassword(currentPassword, user.password);
  
  if (!isPasswordValid) {
    throw new Error('Current password is incorrect');
  }
  
  // Hash new password
  const hashedPassword = await hashPassword(newPassword);
  
  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
    },
  });
}

/**
 * Validate password strength
 * @param password Password to validate
 * @returns True if password meets requirements
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate email format
 * @param email Email to validate
 * @returns True if email is valid
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
