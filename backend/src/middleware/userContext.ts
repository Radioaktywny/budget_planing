import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Default user email for single-user mode
export const DEFAULT_USER_EMAIL = 'user@budgetmanager.local';

// Extend Express Request to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Middleware to attach user context to requests
 * 
 * Current Implementation (Single-User Mode):
 * - Uses default user email or x-user-email header
 * - Looks up user in database and attaches userId to request
 * 
 * Future Authentication Integration:
 * - Replace with JWT token verification
 * - Extract userId from verified token payload
 * - Add role-based access control if needed
 * 
 * @param req Express request object
 * @param res Express response object
 * @param next Next middleware function
 */
export async function userContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // TODO: Replace with JWT token extraction when authentication is implemented
    // Example: const token = req.headers.authorization?.split(' ')[1];
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // req.userId = decoded.userId;
    
    const userEmail = (req.headers['x-user-email'] as string) || DEFAULT_USER_EMAIL;
    
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found. Please ensure the database is seeded.',
        },
      });
      return;
    }

    // Attach userId to request for use in controllers
    req.userId = user.id;
    next();
  } catch (error) {
    console.error('Error in user context middleware:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to authenticate user',
      },
    });
  }
}

/**
 * Helper function to get user ID from request
 * Use this in controllers to access the authenticated user's ID
 * 
 * @param req Express request object
 * @returns User ID string
 * @throws Error if userId is not set (middleware not applied)
 */
export function getUserId(req: Request): string {
  if (!req.userId) {
    throw new Error('User context not found. Ensure userContextMiddleware is applied.');
  }
  return req.userId;
}

/**
 * Ensure default user exists in database
 * This should be called on application startup
 */
export async function ensureDefaultUser(): Promise<void> {
  try {
    const user = await prisma.user.upsert({
      where: { email: DEFAULT_USER_EMAIL },
      update: {},
      create: {
        email: DEFAULT_USER_EMAIL,
        name: 'Default User',
      },
    });
    console.log(`✓ Default user ready: ${user.name} (${user.email})`);
  } catch (error) {
    console.error('Error ensuring default user exists:', error);
    throw error;
  }
}
