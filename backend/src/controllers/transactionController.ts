import { Request, Response } from 'express';
import * as transactionService from '../services/transactionService';
import { getUserId } from '../middleware/userContext';
import { z } from 'zod';

/**
 * GET /api/transactions
 * Get all transactions with optional filtering, sorting, and pagination
 * 
 * Query parameters:
 * - accountId: Filter by single account ID
 * - accountIds: Filter by multiple account IDs (comma-separated)
 * - categoryId: Filter by category ID
 * - includeSubcategories: Include child categories (true/false)
 * - type: Filter by transaction type (INCOME, EXPENSE, TRANSFER)
 * - startDate: Filter by start date (ISO format)
 * - endDate: Filter by end date (ISO format)
 * - search: Text search on description
 * - tagIds: Filter by tag IDs (comma-separated, AND logic)
 * - sortBy: Sort field (date, amount, description, category)
 * - sortOrder: Sort order (asc, desc)
 * - page: Page number for pagination
 * - limit: Items per page
 */
export async function getAllTransactions(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    
    // Parse query parameters for filtering
    const filters: any = {};
    
    // Account filtering
    if (req.query.accountId) {
      filters.accountId = req.query.accountId as string;
    }
    
    if (req.query.accountIds) {
      const accountIdsStr = req.query.accountIds as string;
      filters.accountIds = accountIdsStr.split(',').map(id => id.trim());
    }
    
    // Category filtering
    if (req.query.categoryId) {
      filters.categoryId = req.query.categoryId as string;
    }
    
    if (req.query.includeSubcategories) {
      filters.includeSubcategories = req.query.includeSubcategories === 'true';
    }
    
    // Transaction type
    if (req.query.type) {
      filters.type = req.query.type as string;
    }
    
    // Date range
    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string);
    }
    
    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string);
    }
    
    // Text search
    if (req.query.search) {
      filters.search = req.query.search as string;
    }
    
    // Tag filtering
    if (req.query.tagIds) {
      const tagIdsStr = req.query.tagIds as string;
      filters.tagIds = tagIdsStr.split(',').map(id => id.trim());
    }
    
    // Sorting
    if (req.query.sortBy) {
      filters.sortBy = req.query.sortBy as string;
    }
    
    if (req.query.sortOrder) {
      filters.sortOrder = req.query.sortOrder as string;
    }
    
    // Pagination
    if (req.query.page) {
      filters.page = parseInt(req.query.page as string, 10);
    }
    
    if (req.query.limit) {
      filters.limit = parseInt(req.query.limit as string, 10);
    }

    // If pagination parameters are provided, use paginated endpoint
    if (filters.page || filters.limit) {
      const result = await transactionService.getPaginatedTransactions(userId, filters);
      res.json(result);
    } else {
      // Otherwise, return all transactions
      const transactions = await transactionService.getAllTransactions(userId, filters);
      res.json(transactions);
    }
  } catch (error) {
    console.error('Error fetching transactions:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid')) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
          },
        });
        return;
      }
    }
    
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
    const userId = getUserId(req);
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
    const userId = getUserId(req);
    
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
    const userId = getUserId(req);
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
    const userId = getUserId(req);
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
    const userId = getUserId(req);
    
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

/**
 * POST /api/transactions/split
 * Create a split transaction with multiple child items
 */
export async function createSplitTransaction(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    
    const splitData = {
      ...req.body,
      userId,
    };

    const result = await transactionService.createSplitTransaction(splitData);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating split transaction:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid split transaction data',
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

      if (error.message.includes('must equal')) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
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
        message: 'Failed to create split transaction',
      },
    });
  }
}

/**
 * GET /api/transactions/:id/items
 * Get all child items for a split transaction
 */
export async function getSplitTransactionItems(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const items = await transactionService.getSplitTransactionItems(id, userId);
    res.json(items);
  } catch (error) {
    console.error('Error fetching split transaction items:', error);
    
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

      if (error.message.includes('not a parent')) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
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
        message: 'Failed to fetch split transaction items',
      },
    });
  }
}

/**
 * POST /api/transactions/bulk
 * Create multiple transactions in bulk (for import approval)
 */
export async function createBulkTransactions(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    
    const transactions = await transactionService.createBulkTransactions(req.body, userId);
    res.status(201).json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error('Error creating bulk transactions:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid bulk transaction data',
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

      if (error.message.includes('Failed to create')) {
        res.status(400).json({
          error: {
            code: 'BULK_CREATE_ERROR',
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
        message: 'Failed to create bulk transactions',
      },
    });
  }
}
