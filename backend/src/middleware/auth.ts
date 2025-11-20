import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../services/authService';

const prisma = new PrismaClient();

// Extend Express Request to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Authentication middleware that verifies JWT tokens
 * Extracts userId from token and attaches to request
 * 
 * @param req Express request object
 * @param res Express response object
 * @param next Next middleware function
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'No authorization token provided',
        },
      });
      return;
    }
    
    // Check if header starts with "Bearer "
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid authorization header format. Expected: Bearer <token>',
        },
      });
      return;
    }
    
    // Extract token
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    if (!token) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided',
        },
      });
      return;
    }
    
    // Verify token
    let payload;
    try {
      payload = verifyToken(token);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'TokenExpiredError') {
          res.status(401).json({
            error: {
              code: 'TOKEN_EXPIRED',
              message: 'Token has expired. Please refresh your token.',
            },
          });
          return;
        }
        if (error.name === 'JsonWebTokenError') {
          res.status(401).json({
            error: {
              code: 'INVALID_TOKEN',
              message: 'Invalid token',
            },
          });
          return;
        }
      }
      throw error;
    }
    
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    
    if (!user) {
      res.status(401).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
      return;
    }
    
    // Attach userId to request
    req.userId = payload.userId;
    
    next();
  } catch (error) {
    console.error('Error in authentication middleware:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to authenticate user',
      },
    });
  }
}

/**
 * Optional middleware for routes that work with or without authentication
 * Attaches userId if valid token is provided, but doesn't require it
 * 
 * @param req Express request object
 * @param _res Express response object (unused)
 * @param next Next middleware function
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      next();
      return;
    }
    
    const token = authHeader.substring(7);
    
    try {
      const payload = verifyToken(token);
      
      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });
      
      if (user) {
        req.userId = payload.userId;
      }
    } catch (error) {
      // Invalid token, but we don't fail - just continue without auth
      console.log('Optional auth: Invalid token provided, continuing without authentication');
    }
    
    next();
  } catch (error) {
    console.error('Error in optional authentication middleware:', error);
    next();
  }
}
