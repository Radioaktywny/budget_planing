import { Request, Response } from 'express';
import * as accountService from '../services/accountService';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// For now, we use a default user email since authentication is not yet implemented
// This will be replaced with actual user authentication in the future
const DEFAULT_USER_EMAIL = 'user@budgetmanager.local';

/**
 * Helper function to get user ID from request
 * Currently looks up default user by email, will be replaced with actual auth
 */
async function getUserId(req: Request): Promise<string> {
  // TODO: Extract from JWT token when authentication is implemented
  const userEmail = req.headers['x-user-email'] as string || DEFAULT_USER_EMAIL;
  
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user.id;
}

/**
 * GET /api/accounts
 * Get all accounts for the current user
 */
export async function getAllAccounts(req: Request, res: Response): Promise<void> {
  try {
    const userId = await getUserId(req);
    const accounts = await accountService.getAllAccounts(userId);
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch accounts',
      },
    });
  }
}

/**
 * GET /api/accounts/:id
 * Get a single account by ID
 */
export async function getAccountById(req: Request, res: Response): Promise<void> {
  try {
    const userId = await getUserId(req);
    const { id } = req.params;

    const account = await accountService.getAccountById(id, userId);
    
    if (!account) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Account not found',
        },
      });
      return;
    }

    res.json(account);
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch account',
      },
    });
  }
}

/**
 * POST /api/accounts
 * Create a new account
 */
export async function createAccount(req: Request, res: Response): Promise<void> {
  try {
    const userId = await getUserId(req);
    
    const accountData = {
      ...req.body,
      userId,
    };

    const account = await accountService.createAccount(accountData);
    res.status(201).json(account);
  } catch (error) {
    console.error('Error creating account:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid account data',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
      return;
    }

    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        res.status(409).json({
          error: {
            code: 'CONFLICT',
            message: error.message,
          },
        });
        return;
      }

      res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: error.message,
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create account',
      },
    });
  }
}

/**
 * PUT /api/accounts/:id
 * Update an existing account
 */
export async function updateAccount(req: Request, res: Response): Promise<void> {
  try {
    const userId = await getUserId(req);
    const { id } = req.params;

    const account = await accountService.updateAccount(id, userId, req.body);
    res.json(account);
  } catch (error) {
    console.error('Error updating account:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid account data',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
      return;
    }

    if (error instanceof Error) {
      if (error.message === 'Account not found') {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
        return;
      }

      if (error.message.includes('already exists')) {
        res.status(409).json({
          error: {
            code: 'CONFLICT',
            message: error.message,
          },
        });
        return;
      }

      res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: error.message,
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update account',
      },
    });
  }
}

/**
 * DELETE /api/accounts/:id
 * Delete an account (only if it has no transactions)
 */
export async function deleteAccount(req: Request, res: Response): Promise<void> {
  try {
    const userId = await getUserId(req);
    const { id } = req.params;

    await accountService.deleteAccount(id, userId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting account:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Account not found') {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
        return;
      }

      if (error.message.includes('Cannot delete')) {
        res.status(409).json({
          error: {
            code: 'CONFLICT',
            message: error.message,
          },
        });
        return;
      }

      res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: error.message,
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete account',
      },
    });
  }
}

/**
 * GET /api/accounts/:id/balance
 * Get current balance for an account
 */
export async function getAccountBalance(req: Request, res: Response): Promise<void> {
  try {
    const userId = await getUserId(req);
    const { id } = req.params;

    const balance = await accountService.getAccountBalance(id, userId);
    res.json({ balance });
  } catch (error) {
    console.error('Error fetching account balance:', error);
    
    if (error instanceof Error && error.message === 'Account not found') {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: error.message,
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch account balance',
      },
    });
  }
}
