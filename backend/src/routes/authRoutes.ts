import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPasswordHandler,
  changePasswordHandler,
  getCurrentUser,
} from '../controllers/authController';
import { requireAuth } from '../middleware/auth';
import {
  authRateLimiter,
  passwordResetRateLimiter,
} from '../middleware/security';

const router = Router();

/**
 * Public routes (no authentication required)
 */

// Register a new user (rate limited)
router.post('/register', authRateLimiter, register);

// Login with email and password (rate limited)
router.post('/login', authRateLimiter, login);

// Refresh access token using refresh token
router.post('/refresh', refresh);

// Initiate password reset (rate limited)
router.post('/forgot-password', passwordResetRateLimiter, forgotPassword);

// Reset password using reset token (rate limited)
router.post('/reset-password', passwordResetRateLimiter, resetPasswordHandler);

/**
 * Protected routes (authentication required)
 */

// Logout (invalidate refresh token)
router.post('/logout', requireAuth, logout);

// Change password (when logged in)
router.post('/change-password', requireAuth, changePasswordHandler);

// Get current user profile
router.get('/me', requireAuth, getCurrentUser);

export default router;
