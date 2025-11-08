import { Request, Response } from 'express';
import * as transactionService from '../services/transactionService';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// For now, we use a default user email since authentication is not yet implemented
const DEFAULT_USER_EMAIL = 'user@budgetmanager.local';

/**
 * Helper function to get user ID from request
 */
async function getUserId(req: Request): Promise<string> {
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
 * GET /api/transactions
 * Get all transactions with optional filtering
 */
export async function getAllTransactions(req: Request, res: Response): Promise<void> {
  try {
    const userId = await getUserId(req);
    
    // Parse query parameters for filtering
    const filters: any = {};
    
    if (req.query.accountId) {
      filters.accountId = req.query.accountId as string;
    }
    
    if (req.query.categoryId) {
      filters.categoryId = req.query.categoryId as string;
    }
    
    if (req.query.type) {
      filters.type = req.query.type as string;
    }
    
    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string);
    }
    
    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string);
    }
    
    if (req.query.search) {
      filters.search = req.query.search as string;
    }

    const transactions = await transactionService.getAllTransactions(userId, filters);
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch transactions',
      },
    });
  }
}

/**
 * GET /api/transactions/:id
 * Get a single transaction by ID
 */
export async function getTransactionById(req: Request, res: Response): Promise<void> {
  try {
    const userId = await getUserId(req);
    const { id } = req.params;

    const transaction = await transactionService.getTransactionById(id, userId);
    
    if (!transaction) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Transaction not found',
        },
      });
      return;
    }

    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch transaction',
      },
    });
  }
}

/**
 * POST /api/transactions
 * Create a new transaction
 */
export async function createTransaction(req: Request, res: Response): Promise<void> {
  try {
    const userId = await getUserId(req);
    
    const transactionData = {
      ...req.body,
      userId,
    };

    const transaction = await transactionService.createTransaction(transactionData);
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid transaction data',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
      return;
    }

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
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
        message: 'Failed to create transaction',
      },
    });
  }
}

/**
 * PUT /api/transactions/:id
 * Update an existing transaction
 */
export async function updateTransaction(req: Request, res: Response): Promise<void> {
  try {
    const userId = await getUserId(req);
    const { id } = req.params;

    const transaction = await transactionService.updateTransaction(id, userId, req.body);
    res.json(transaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid transaction data',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
      return;
    }

    if (error instanceof Error) {
      if (error.message === 'Transaction not found') {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
        return;
      }

      if (error.message.includes('not found')) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
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
        message: 'Failed to update transaction',
      },
    });
  }
}

/**
 * DELETE /api/transactions/:id
 * Delete a transaction
 */
export async function deleteTransaction(req: Request, res: Response): Promise<void> {
  try {
    const userId = await getUserId(req);
    const { id } = req.params;

    await transactionService.deleteTransaction(id, userId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting transaction:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Transaction not found') {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
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
        message: 'Failed to delete transaction',
      },
    });
  }
}

/**
 * POST /api/transactions/transfer
 * Create a transfer between two accounts
 */
export async function createTransfer(req: Request, res: Response): Promise<void> {
  try {
    const userId = await getUserId(req);
    
    const transferData = {
      ...req.body,
      userId,
    };

    const result = await transactionService.createTransfer(transferData);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating transfer:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid transfer data',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
      return;
    }

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
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
        message: 'Failed to create transfer',
      },
    });
  }
}
