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

const router = Router();

/**
 * Public routes (no authentication required)
 */

// Register a new user
router.post('/register', register);

// Login with email and password
router.post('/login', login);

// Refresh access token using refresh token
router.post('/refresh', refresh);

// Initiate password reset
router.post('/forgot-password', forgotPassword);

// Reset password using reset token
router.post('/reset-password', resetPasswordHandler);

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
