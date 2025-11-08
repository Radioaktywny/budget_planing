import { PrismaClient } from '@prisma/client';
import * as transactionService from '../transactionService';
import * as accountService from '../accountService';

const prisma = new PrismaClient();

let testUserId: string;
let testAccountId: string;
let testCategoryId: string;

beforeAll(async () => {
  let testUser = await prisma.user.findUnique({
    where: { email: 'test@transactionservice.test' },
  });

  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: 'test@transactionservice.test',
        name: 'Test User',
      },
    });
  }
  
  testUserId = testUser.id;

  const account = await accountService.createAccount({
    name: 'Test Account',
    type: 'CHECKING',
    userId: testUserId,
  });
  testAccountId = account.id;

  const category = await prisma.category.create({
    data: {
      name: 'Test Category',
      userId: testUserId,
    },
  });
  testCategoryId = category.id;
});

afterAll(async () => {
  if (testUserId) {
    const accounts = await prisma.account.findMany({ where: { userId: testUserId } });
    const accountIds = accounts.map(a => a.id);
    
    if (accountIds.length > 0) {
      await prisma.transfer.deleteMany({
        where: {
          OR: [
            { fromAccountId: { in: accountIds } },
            { toAccountId: { in: accountIds } },
          ],
        },
      });
    }
    await prisma.transactionTag.deleteMany({
      where: { transaction: { userId: testUserId } },
    });
    await prisma.transaction.deleteMany({ where: { userId: testUserId } });
    await prisma.category.deleteMany({ where: { userId: testUserId } });
    await prisma.tag.deleteMany({ where: { userId: testUserId } });
    await prisma.account.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
  }
  await prisma.$disconnect();
});

afterEach(async () => {
  const accounts = await prisma.account.findMany({ where: { userId: testUserId } });
  const accountIds = accounts.map(a => a.id);
  
  if (accountIds.length > 0) {
    await prisma.transfer.deleteMany({
      where: {
        OR: [
          { fromAccountId: { in: accountIds } },
          { toAccountId: { in: accountIds } },
        ],
      },
    });
  }
  await prisma.transactionTag.deleteMany({
    where: { transaction: { userId: testUserId } },
  });
  await prisma.transaction.deleteMany({ where: { userId: testUserId } });
  await accountService.updateAccountBalance(testAccountId, 0);
});

describe('Transaction Service', () => {
  describe('createTransaction', () => {
    it('should create an income transaction and update account balance', async () => {
      const transactionData = {
        date: new Date('2024-01-15'),
        amount: 1000,
        type: 'INCOME' as const,
        description: 'Salary',
        accountId: testAccountId,
        userId: testUserId,
      };

      const transaction = await transactionService.createTransaction(transactionData);

      expect(transaction).toBeDefined();
      expect(transaction.id).toBeDefined();
      expect(transaction.amount).toBe(1000);
      expect(transaction.type).toBe('INCOME');
      expect(transaction.description).toBe('Salary');

      const account = await accountService.getAccountById(testAccountId, testUserId);
      expect(account?.balance).toBe(1000);
    });

    it('should create an expense transaction and update account balance', async () => {
      const transactionData = {
        date: new Date('2024-01-15'),
        amount: 50,
        type: 'EXPENSE' as const,
        description: 'Groceries',
        accountId: testAccountId,
        userId: testUserId,
      };

      const transaction = await transactionService.createTransaction(transactionData);

      expect(transaction).toBeDefined();
      expect(transaction.amount).toBe(50);
      expect(transaction.type).toBe('EXPENSE');

      const account = await accountService.getAccountById(testAccountId, testUserId);
      expect(account?.balance).toBe(-50);
    });

    it('should create transaction with category', async () => {
      const transactionData = {
        date: new Date('2024-01-15'),
        amount: 100,
        type: 'EXPENSE' as const,
        description: 'Shopping',
        accountId: testAccountId,
        categoryId: testCategoryId,
        userId: testUserId,
      };

      const transaction = await transactionService.createTransaction(transactionData);

      expect(transaction.category).toBeDefined();
      expect(transaction.category?.id).toBe(testCategoryId);
    });

    it('should throw error when amount is zero', async () => {
      const transactionData = {
        date: new Date('2024-01-15'),
        amount: 0,
        type: 'EXPENSE' as const,
        description: 'Invalid',
        accountId: testAccountId,
        userId: testUserId,
      };

      await expect(transactionService.createTransaction(transactionData)).rejects.toThrow();
    });

    it('should throw error when description is empty', async () => {
      const transactionData = {
        date: new Date('2024-01-15'),
        amount: 100,
        type: 'EXPENSE' as const,
        description: '',
        accountId: testAccountId,
        userId: testUserId,
      };

      await expect(transactionService.createTransaction(transactionData)).rejects.toThrow();
    });

    it('should throw error when account does not exist', async () => {
      const transactionData = {
        date: new Date('2024-01-15'),
        amount: 100,
        type: 'EXPENSE' as const,
        description: 'Test',
        accountId: '00000000-0000-0000-0000-000000000000',
        userId: testUserId,
      };

      await expect(transactionService.createTransaction(transactionData)).rejects.toThrow(
        'Account not found'
      );
    });
  });

  describe('updateTransaction', () => {
    it('should update transaction description', async () => {
      const transaction = await transactionService.createTransaction({
        date: new Date('2024-01-15'),
        amount: 100,
        type: 'EXPENSE',
        description: 'Original Description',
        accountId: testAccountId,
        userId: testUserId,
      });

      const updated = await transactionService.updateTransaction(
        transaction.id,
        testUserId,
        { description: 'Updated Description' }
      );

      expect(updated.description).toBe('Updated Description');
      expect(updated.amount).toBe(100);
    });

    it('should update transaction amount and recalculate balance', async () => {
      const transaction = await transactionService.createTransaction({
        date: new Date('2024-01-15'),
        amount: 100,
        type: 'EXPENSE',
        description: 'Test',
        accountId: testAccountId,
        userId: testUserId,
      });

      let account = await accountService.getAccountById(testAccountId, testUserId);
      expect(account?.balance).toBe(-100);

      await transactionService.updateTransaction(
        transaction.id,
        testUserId,
        { amount: 200 }
      );

      account = await accountService.getAccountById(testAccountId, testUserId);
      expect(account?.balance).toBe(-200);
    });

    it('should update transaction type and recalculate balance', async () => {
      const transaction = await transactionService.createTransaction({
        date: new Date('2024-01-15'),
        amount: 100,
        type: 'EXPENSE',
        description: 'Test',
        accountId: testAccountId,
        userId: testUserId,
      });

      let account = await accountService.getAccountById(testAccountId, testUserId);
      expect(account?.balance).toBe(-100);

      await transactionService.updateTransaction(
        transaction.id,
        testUserId,
        { type: 'INCOME' }
      );

      account = await accountService.getAccountById(testAccountId, testUserId);
      expect(account?.balance).toBe(100);
    });

    it('should throw error when updating non-existent transaction', async () => {
      await expect(
        transactionService.updateTransaction('non-existent-id', testUserId, {
          description: 'Updated',
        })
      ).rejects.toThrow('Transaction not found');
    });
  });

  describe('deleteTransaction', () => {
    it('should delete transaction and update account balance', async () => {
      const transaction = await transactionService.createTransaction({
        date: new Date('2024-01-15'),
        amount: 100,
        type: 'EXPENSE',
        description: 'Test',
        accountId: testAccountId,
        userId: testUserId,
      });

      let account = await accountService.getAccountById(testAccountId, testUserId);
      expect(account?.balance).toBe(-100);

      await transactionService.deleteTransaction(transaction.id, testUserId);

      account = await accountService.getAccountById(testAccountId, testUserId);
      expect(account?.balance).toBe(0);

      const deleted = await transactionService.getTransactionById(transaction.id, testUserId);
      expect(deleted).toBeNull();
    });

    it('should delete income transaction and update balance correctly', async () => {
      const transaction = await transactionService.createTransaction({
        date: new Date('2024-01-15'),
        amount: 500,
        type: 'INCOME',
        description: 'Salary',
        accountId: testAccountId,
        userId: testUserId,
      });

      let account = await accountService.getAccountById(testAccountId, testUserId);
      expect(account?.balance).toBe(500);

      await transactionService.deleteTransaction(transaction.id, testUserId);

      account = await accountService.getAccountById(testAccountId, testUserId);
      expect(account?.balance).toBe(0);
    });

    it('should throw error when deleting non-existent transaction', async () => {
      await expect(
        transactionService.deleteTransaction('non-existent-id', testUserId)
      ).rejects.toThrow('Transaction not found');
    });
  });

  describe('balance recalculation', () => {
    it('should correctly calculate balance with multiple transactions', async () => {
      await transactionService.createTransaction({
        date: new Date('2024-01-01'),
        amount: 1000,
        type: 'INCOME',
        description: 'Salary',
        accountId: testAccountId,
        userId: testUserId,
      });

      await transactionService.createTransaction({
        date: new Date('2024-01-05'),
        amount: 200,
        type: 'EXPENSE',
        description: 'Groceries',
        accountId: testAccountId,
        userId: testUserId,
      });

      await transactionService.createTransaction({
        date: new Date('2024-01-10'),
        amount: 150,
        type: 'EXPENSE',
        description: 'Utilities',
        accountId: testAccountId,
        userId: testUserId,
      });

      await transactionService.createTransaction({
        date: new Date('2024-01-15'),
        amount: 500,
        type: 'INCOME',
        description: 'Bonus',
        accountId: testAccountId,
        userId: testUserId,
      });

      const account = await accountService.getAccountById(testAccountId, testUserId);
      expect(account?.balance).toBe(1150);
    });

    it('should maintain correct balance after multiple updates', async () => {
      const transaction = await transactionService.createTransaction({
        date: new Date('2024-01-15'),
        amount: 100,
        type: 'EXPENSE',
        description: 'Test',
        accountId: testAccountId,
        userId: testUserId,
      });

      let account = await accountService.getAccountById(testAccountId, testUserId);
      expect(account?.balance).toBe(-100);

      await transactionService.updateTransaction(transaction.id, testUserId, { amount: 200 });
      account = await accountService.getAccountById(testAccountId, testUserId);
      expect(account?.balance).toBe(-200);

      await transactionService.updateTransaction(transaction.id, testUserId, { type: 'INCOME' });
      account = await accountService.getAccountById(testAccountId, testUserId);
      expect(account?.balance).toBe(200);

      await transactionService.updateTransaction(transaction.id, testUserId, { amount: 300 });
      account = await accountService.getAccountById(testAccountId, testUserId);
      expect(account?.balance).toBe(300);
    });
  });

  describe('validation', () => {
    it('should validate transaction type', async () => {
      const invalidData: any = {
        date: new Date('2024-01-15'),
        amount: 100,
        type: 'INVALID_TYPE',
        description: 'Test',
        accountId: testAccountId,
        userId: testUserId,
      };

      await expect(transactionService.createTransaction(invalidData)).rejects.toThrow();
    });
  });

  describe('createTransfer', () => {
    let fromAccountId: string;
    let toAccountId: string;

    beforeEach(async () => {
      // Delete any existing accounts with these names first
      const existingAccounts = await prisma.account.findMany({
        where: {
          userId: testUserId,
          name: { in: ['From Account', 'To Account'] },
        },
      });

      for (const account of existingAccounts) {
        await prisma.account.delete({ where: { id: account.id } });
      }

      const fromAccount = await accountService.createAccount({
        name: 'From Account',
        type: 'CHECKING',
        userId: testUserId,
      });
      fromAccountId = fromAccount.id;

      const toAccount = await accountService.createAccount({
        name: 'To Account',
        type: 'SAVINGS',
        userId: testUserId,
      });
      toAccountId = toAccount.id;

      // Set initial balance for from account
      await accountService.updateAccountBalance(fromAccountId, 1000);
    });

    it('should create transfer between two accounts and update both balances', async () => {
      const transferData = {
        date: new Date('2024-01-15'),
        amount: 300,
        description: 'Transfer to savings',
        fromAccountId,
        toAccountId,
        userId: testUserId,
      };

      const result = await transactionService.createTransfer(transferData);

      expect(result.fromTransaction).toBeDefined();
      expect(result.toTransaction).toBeDefined();
      expect(result.fromTransaction.type).toBe('TRANSFER');
      expect(result.toTransaction.type).toBe('TRANSFER');
      expect(result.fromTransaction.amount).toBe(300);
      expect(result.toTransaction.amount).toBe(300);

      // Check balances
      const fromAccount = await accountService.getAccountById(fromAccountId, testUserId);
      const toAccount = await accountService.getAccountById(toAccountId, testUserId);
      
      expect(fromAccount?.balance).toBe(700); // 1000 - 300
      expect(toAccount?.balance).toBe(300); // 0 + 300
    });

    it('should create transfer record linking both transactions', async () => {
      const transferData = {
        date: new Date('2024-01-15'),
        amount: 200,
        description: 'Transfer',
        fromAccountId,
        toAccountId,
        userId: testUserId,
      };

      const result = await transactionService.createTransfer(transferData);

      // Check that transfer record exists
      const transfer = await prisma.transfer.findUnique({
        where: { transactionId: result.fromTransaction.id },
      });

      expect(transfer).toBeDefined();
      expect(transfer?.fromAccountId).toBe(fromAccountId);
      expect(transfer?.toAccountId).toBe(toAccountId);
    });

    it('should throw error when transferring to the same account', async () => {
      const transferData = {
        date: new Date('2024-01-15'),
        amount: 100,
        description: 'Invalid transfer',
        fromAccountId,
        toAccountId: fromAccountId,
        userId: testUserId,
      };

      await expect(transactionService.createTransfer(transferData)).rejects.toThrow(
        'Cannot transfer to the same account'
      );
    });

    it('should throw error when source account does not exist', async () => {
      const transferData = {
        date: new Date('2024-01-15'),
        amount: 100,
        description: 'Invalid transfer',
        fromAccountId: '00000000-0000-0000-0000-000000000000',
        toAccountId,
        userId: testUserId,
      };

      await expect(transactionService.createTransfer(transferData)).rejects.toThrow(
        'Source account not found'
      );
    });

    it('should throw error when destination account does not exist', async () => {
      const transferData = {
        date: new Date('2024-01-15'),
        amount: 100,
        description: 'Invalid transfer',
        fromAccountId,
        toAccountId: '00000000-0000-0000-0000-000000000000',
        userId: testUserId,
      };

      await expect(transactionService.createTransfer(transferData)).rejects.toThrow(
        'Destination account not found'
      );
    });

    it('should throw error when amount is zero or negative', async () => {
      const transferData = {
        date: new Date('2024-01-15'),
        amount: 0,
        description: 'Invalid transfer',
        fromAccountId,
        toAccountId,
        userId: testUserId,
      };

      await expect(transactionService.createTransfer(transferData)).rejects.toThrow();
    });

    it('should rollback balances when transfer transaction is deleted', async () => {
      const transferData = {
        date: new Date('2024-01-15'),
        amount: 250,
        description: 'Transfer to delete',
        fromAccountId,
        toAccountId,
        userId: testUserId,
      };

      const result = await transactionService.createTransfer(transferData);

      // Verify balances after transfer
      let fromAccount = await accountService.getAccountById(fromAccountId, testUserId);
      let toAccount = await accountService.getAccountById(toAccountId, testUserId);
      expect(fromAccount?.balance).toBe(750); // 1000 - 250
      expect(toAccount?.balance).toBe(250); // 0 + 250

      // Delete the from transaction
      await transactionService.deleteTransaction(result.fromTransaction.id, testUserId);

      // Verify balance is rolled back for from account
      fromAccount = await accountService.getAccountById(fromAccountId, testUserId);
      expect(fromAccount?.balance).toBe(1000); // Restored to original

      // Delete the to transaction
      await transactionService.deleteTransaction(result.toTransaction.id, testUserId);

      // Verify balance is rolled back for to account
      toAccount = await accountService.getAccountById(toAccountId, testUserId);
      expect(toAccount?.balance).toBe(0); // Restored to original
    });
  });

  describe('createSplitTransaction', () => {
    it('should create split transaction with multiple items', async () => {
      const splitData = {
        date: new Date('2024-01-15'),
        amount: 85.50,
        type: 'EXPENSE' as const,
        description: 'Walmart Receipt',
        accountId: testAccountId,
        userId: testUserId,
        items: [
          {
            amount: 35.00,
            description: 'Groceries',
            categoryId: testCategoryId,
          },
          {
            amount: 40.00,
            description: 'USB Cable',
            categoryId: testCategoryId,
          },
          {
            amount: 10.50,
            description: 'Shampoo',
            categoryId: testCategoryId,
          },
        ],
      };

      const result = await transactionService.createSplitTransaction(splitData);

      expect(result.parent).toBeDefined();
      expect(result.parent.isParent).toBe(true);
      expect(result.parent.amount).toBe(85.50);
      expect(result.parent.categoryId).toBeNull();
      expect(result.items).toHaveLength(3);
      expect(result.items[0].amount).toBe(35.00);
      expect(result.items[1].amount).toBe(40.00);
      expect(result.items[2].amount).toBe(10.50);
      expect(result.items[0].parentId).toBe(result.parent.id);

      const account = await accountService.getAccountById(testAccountId, testUserId);
      expect(account?.balance).toBe(-85.50);
    });

    it('should throw error when child amounts do not sum to parent amount', async () => {
      const splitData = {
        date: new Date('2024-01-15'),
        amount: 100.00,
        type: 'EXPENSE' as const,
        description: 'Invalid Split',
        accountId: testAccountId,
        userId: testUserId,
        items: [
          {
            amount: 35.00,
            description: 'Item 1',
            categoryId: testCategoryId,
          },
          {
            amount: 40.00,
            description: 'Item 2',
            categoryId: testCategoryId,
          },
        ],
      };

      await expect(transactionService.createSplitTransaction(splitData)).rejects.toThrow(
        'Sum of item amounts'
      );
    });

    it('should create split transaction with different categories for each item', async () => {
      const category1 = await prisma.category.create({
        data: { name: 'Food', userId: testUserId },
      });
      const category2 = await prisma.category.create({
        data: { name: 'Electronics', userId: testUserId },
      });

      const splitData = {
        date: new Date('2024-01-15'),
        amount: 75.00,
        type: 'EXPENSE' as const,
        description: 'Mixed Purchase',
        accountId: testAccountId,
        userId: testUserId,
        items: [
          {
            amount: 35.00,
            description: 'Groceries',
            categoryId: category1.id,
          },
          {
            amount: 40.00,
            description: 'USB Cable',
            categoryId: category2.id,
          },
        ],
      };

      const result = await transactionService.createSplitTransaction(splitData);

      expect(result.items[0].categoryId).toBe(category1.id);
      expect(result.items[1].categoryId).toBe(category2.id);
    });

    it('should throw error when category does not exist', async () => {
      const splitData = {
        date: new Date('2024-01-15'),
        amount: 50.00,
        type: 'EXPENSE' as const,
        description: 'Test',
        accountId: testAccountId,
        userId: testUserId,
        items: [
          {
            amount: 50.00,
            description: 'Item',
            categoryId: '00000000-0000-0000-0000-000000000000',
          },
        ],
      };

      await expect(transactionService.createSplitTransaction(splitData)).rejects.toThrow(
        'Category not found'
      );
    });
  });

  describe('getSplitTransactionItems', () => {
    it('should get all child items for a parent transaction', async () => {
      const splitData = {
        date: new Date('2024-01-15'),
        amount: 60.00,
        type: 'EXPENSE' as const,
        description: 'Split Purchase',
        accountId: testAccountId,
        userId: testUserId,
        items: [
          {
            amount: 30.00,
            description: 'Item 1',
            categoryId: testCategoryId,
          },
          {
            amount: 30.00,
            description: 'Item 2',
            categoryId: testCategoryId,
          },
        ],
      };

      const result = await transactionService.createSplitTransaction(splitData);
      const items = await transactionService.getSplitTransactionItems(
        result.parent.id,
        testUserId
      );

      expect(items).toHaveLength(2);
      expect(items[0].amount).toBe(30.00);
      expect(items[1].amount).toBe(30.00);
    });

    it('should throw error when parent transaction does not exist', async () => {
      await expect(
        transactionService.getSplitTransactionItems('non-existent-id', testUserId)
      ).rejects.toThrow('Parent transaction not found');
    });

    it('should throw error when transaction is not a parent', async () => {
      const transaction = await transactionService.createTransaction({
        date: new Date('2024-01-15'),
        amount: 100,
        type: 'EXPENSE',
        description: 'Regular Transaction',
        accountId: testAccountId,
        userId: testUserId,
      });

      await expect(
        transactionService.getSplitTransactionItems(transaction.id, testUserId)
      ).rejects.toThrow('not a parent transaction');
    });
  });

  describe('deleteTransaction with split transactions', () => {
    it('should cascade delete all child items when parent is deleted', async () => {
      const splitData = {
        date: new Date('2024-01-15'),
        amount: 90.00,
        type: 'EXPENSE' as const,
        description: 'Split to Delete',
        accountId: testAccountId,
        userId: testUserId,
        items: [
          {
            amount: 45.00,
            description: 'Item 1',
            categoryId: testCategoryId,
          },
          {
            amount: 45.00,
            description: 'Item 2',
            categoryId: testCategoryId,
          },
        ],
      };

      const result = await transactionService.createSplitTransaction(splitData);

      let account = await accountService.getAccountById(testAccountId, testUserId);
      expect(account?.balance).toBe(-90.00);

      await transactionService.deleteTransaction(result.parent.id, testUserId);

      account = await accountService.getAccountById(testAccountId, testUserId);
      expect(account?.balance).toBe(0);

      const parent = await transactionService.getTransactionById(result.parent.id, testUserId);
      expect(parent).toBeNull();

      const items = await prisma.transaction.findMany({
        where: { parentId: result.parent.id },
      });
      expect(items).toHaveLength(0);
    });

    it('should update balance correctly when deleting split transaction', async () => {
      const splitData = {
        date: new Date('2024-01-15'),
        amount: 100.00,
        type: 'EXPENSE' as const,
        description: 'Split Transaction',
        accountId: testAccountId,
        userId: testUserId,
        items: [
          {
            amount: 60.00,
            description: 'Item 1',
            categoryId: testCategoryId,
          },
          {
            amount: 40.00,
            description: 'Item 2',
            categoryId: testCategoryId,
          },
        ],
      };

      const result = await transactionService.createSplitTransaction(splitData);

      let account = await accountService.getAccountById(testAccountId, testUserId);
      expect(account?.balance).toBe(-100.00);

      await transactionService.deleteTransaction(result.parent.id, testUserId);

      account = await accountService.getAccountById(testAccountId, testUserId);
      expect(account?.balance).toBe(0);
    });
  });
});
