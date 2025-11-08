import { Router } from 'express';
import * as accountController from '../controllers/accountController';

const router = Router();

// GET /api/accounts - Get all accounts
router.get('/', accountController.getAllAccounts);

// GET /api/accounts/:id - Get single account
router.get('/:id', accountController.getAccountById);

// POST /api/accounts - Create new account
router.post('/', accountController.createAccount);

// PUT /api/accounts/:id - Update account
router.put('/:id', accountController.updateAccount);

// DELETE /api/accounts/:id - Delete account
router.delete('/:id', accountController.deleteAccount);

// GET /api/accounts/:id/balance - Get account balance
router.get('/:id/balance', accountController.getAccountBalance);

export default router;
