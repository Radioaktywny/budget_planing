import { Request, Response } from 'express';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  initiatePasswordReset,
  resetPassword,
  changePassword,
  validatePasswordStrength,
  validateEmail,
} from '../services/authService';
import { getUserId } from '../middleware/userContext';

/**
 * Register a new user
 * POST /api/auth/register
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required',
        },
      });
      return;
    }
    
    // Validate email format
    if (!validateEmail(email)) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid email format',
        },
      });
      return;
    }
    
    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password does not meet requirements',
          details: passwordValidation.errors,
        },
      });
      return;
    }
    
    // Register user
    const result = await registerUser(email, password, name);
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        emailVerified: result.user.emailVerified,
      },
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        res.status(409).json({
          error: {
            code: 'USER_EXISTS',
            message: error.message,
          },
        });
        return;
      }
    }
    
    console.error('Error in register controller:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to register user',
      },
    });
  }
}

/**
 * Login a user
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required',
        },
      });
      return;
    }
    
    // Login user
    const result = await loginUser(email, password);
    
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        emailVerified: result.user.emailVerified,
      },
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Invalid email or password')) {
        res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        });
        return;
      }
    }
    
    console.error('Error in login controller:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to login',
      },
    });
  }
}

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;
    
    // Validate required fields
    if (!refreshToken) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Refresh token is required',
        },
      });
      return;
    }
    
    // Refresh tokens
    const tokens = await refreshAccessToken(refreshToken);
    
    res.status(200).json({
      message: 'Token refreshed successfully',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Invalid') || error.message.includes('expired')) {
        res.status(401).json({
          error: {
            code: 'INVALID_TOKEN',
            message: error.message,
          },
        });
        return;
      }
    }
    
    console.error('Error in refresh controller:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to refresh token',
      },
    });
  }
}

/**
 * Logout a user
 * POST /api/auth/logout
 */
export async function logout(req: Request, res: Response): Promise<void> {
  try {
    // Get userId from authenticated request
    const userId = getUserId(req);
    
    // Logout user (invalidate refresh token)
    await logoutUser(userId);
    
    res.status(200).json({
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Error in logout controller:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to logout',
      },
    });
  }
}

/**
 * Initiate password reset
 * POST /api/auth/forgot-password
 */
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;
    
    // Validate required fields
    if (!email) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email is required',
        },
      });
      return;
    }
    
    // Validate email format
    if (!validateEmail(email)) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid email format',
        },
      });
      return;
    }
    
    // Initiate password reset
    const resetToken = await initiatePasswordReset(email);
    
    // In production, send email with reset link
    // For now, return token in response (development only)
    // TODO: Integrate email service
    
    res.status(200).json({
      message: 'If a user with this email exists, a password reset link has been sent',
      // Remove this in production - only for development
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
    });
  } catch (error) {
    // Always return success to prevent email enumeration
    res.status(200).json({
      message: 'If a user with this email exists, a password reset link has been sent',
    });
  }
}

/**
 * Reset password using reset token
 * POST /api/auth/reset-password
 */
export async function resetPasswordHandler(req: Request, res: Response): Promise<void> {
  try {
    const { resetToken, newPassword } = req.body;
    
    // Validate required fields
    if (!resetToken || !newPassword) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Reset token and new password are required',
        },
      });
      return;
    }
    
    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password does not meet requirements',
          details: passwordValidation.errors,
        },
      });
      return;
    }
    
    // Reset password
    await resetPassword(resetToken, newPassword);
    
    res.status(200).json({
      message: 'Password reset successfully',
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Invalid') || error.message.includes('expired')) {
        res.status(400).json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired reset token',
          },
        });
        return;
      }
    }
    
    console.error('Error in reset password controller:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to reset password',
      },
    });
  }
}

/**
 * Change password (when logged in)
 * POST /api/auth/change-password
 */
export async function changePasswordHandler(req: Request, res: Response): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get userId from authenticated request
    const userId = getUserId(req);
    
    // Validate required fields
    if (!currentPassword || !newPassword) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Current password and new password are required',
        },
      });
      return;
    }
    
    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password does not meet requirements',
          details: passwordValidation.errors,
        },
      });
      return;
    }
    
    // Change password
    await changePassword(userId, currentPassword, newPassword);
    
    res.status(200).json({
      message: 'Password changed successfully',
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('incorrect')) {
        res.status(400).json({
          error: {
            code: 'INVALID_PASSWORD',
            message: 'Current password is incorrect',
          },
        });
        return;
      }
    }
    
    console.error('Error in change password controller:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to change password',
      },
    });
  }
}

/**
 * Get current user profile
 * GET /api/auth/me
 */
export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        createdAt: true,
      },
    });
    
    if (!user) {
      res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
      return;
    }
    
    res.status(200).json({
      user,
    });
  } catch (error) {
    console.error('Error in get current user controller:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get user profile',
      },
    });
  }
}
