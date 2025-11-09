import { Router } from 'express';
import * as transactionController from '../controllers/transactionController';

const router = Router();

// GET /api/transactions - Get all transactions with optional filtering
router.get('/', transactionController.getAllTransactions);

// GET /api/transactions/:id - Get single transaction
router.get('/:id', transactionController.getTransactionById);

// GET /api/transactions/:id/items - Get split transaction items
router.get('/:id/items', transactionController.getSplitTransactionItems);

// POST /api/transactions - Create new transaction
router.post('/', transactionController.createTransaction);

// POST /api/transactions/bulk - Create multiple transactions (import approval)
router.post('/bulk', transactionController.createBulkTransactions);

// POST /api/transactions/split - Create split transaction
router.post('/split', transactionController.createSplitTransaction);

// POST /api/transactions/transfer - Create transfer between accounts
router.post('/transfer', transactionController.createTransfer);

// PUT /api/transactions/:id - Update transaction
router.put('/:id', transactionController.updateTransaction);

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', transactionController.deleteTransaction);

export default router;
