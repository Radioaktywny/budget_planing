import { PrismaClient } from '@prisma/client';
import * as accountService from '../../services/accountService';
import * as transactionService from '../../services/transactionService';

const prisma = new PrismaClient();

let testUserId: string;
let testAccountId: string;
let testCategoryId: string;

beforeAll(async () => {
  let testUser = await prisma.user.findUnique({
    where: { email: 'test@transactioncontroller.integration.test' },
  });

  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: 'test@transactioncontroller.integration.test',
        name: 'Test User Integration',
      },
    });
  }

  testUserId = testUser.id;

  const account = await accountService.createAccount({
    name: 'Test Account Integration',
    type: 'CHECKING',
    userId: testUserId,
  });
  testAccountId = account.id;

  const category = await prisma.category.create({
    data: {
      name: 'Test Category Integration',
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

describe('Transaction Controller Integration - Bulk Transactions', () => {
  describe('createBulkTransactions', () => {
    it('should create multiple transactions via bulk endpoint', async () => {
      const bulkData = {
        transactions: [
          {
            date: new Date('2024-01-15'),
            amount: 100,
            type: 'EXPENSE' as const,
            description: 'Bulk Transaction 1',
            accountId: testAccountId,
            categoryId: testCategoryId,
          },
          {
            date: new Date('2024-01-16'),
            amount: 200,
            type: 'INCOME' as const,
            description: 'Bulk Transaction 2',
            accountId: testAccountId,
          },
        ],
      };

      const result = await transactionService.createBulkTransactions(bulkData, testUserId);

      expect(result).toHaveLength(2);
      expect(result[0].description).toBe('Bulk Transaction 1');
      expect(result[1].description).toBe('Bulk Transaction 2');

      // Verify transactions were created in database
      const transactions = await transactionService.getAllTransactions(testUserId);
      expect(transactions.length).toBeGreaterThanOrEqual(2);

      // Verify account balance
      const account = await accountService.getAccountById(testAccountId, testUserId);
      expect(account?.balance).toBe(100); // -100 + 200 = 100
    });

    it('should handle bulk transactions with split items', async () => {
      const bulkData = {
        transactions: [
          {
            date: new Date('2024-01-15'),
            amount: 150,
            type: 'EXPENSE' as const,
            description: 'Split Receipt',
            accountId: testAccountId,
            split: true,
            items: [
              {
                amount: 100,
                description: 'Groceries',
                categoryId: testCategoryId,
              },
              {
                amount: 50,
                description: 'Household Items',
              },
            ],
          },
        ],
      };

      const result = await transactionService.createBulkTransactions(bulkData, testUserId);

      expect(result).toHaveLength(1);
      expect(result[0].isParent).toBe(true);

      // Verify split items
      const splitItems = await transactionService.getSplitTransactionItems(
        result[0].id,
        testUserId
      );
      expect(splitItems).toHaveLength(2);
      expect(splitItems[0].amount).toBe(100);
      expect(splitItems[1].amount).toBe(50);
    });

    it('should handle approval flow - edit and approve transactions', async () => {
      // Simulate import review: create transactions with initial data
      const bulkData = {
        transactions: [
          {
            date: new Date('2024-01-15'),
            amount: 100,
            type: 'EXPENSE' as const,
            description: 'Original Description',
            accountId: testAccountId,
          },
        ],
      };

      const result = await transactionService.createBulkTransactions(bulkData, testUserId);
      expect(result).toHaveLength(1);

      // Simulate editing before approval (update the transaction)
      const updatedTransaction = await transactionService.updateTransaction(
        result[0].id,
        testUserId,
        {
          description: 'Edited Description',
          categoryId: testCategoryId,
        }
      );

      expect(updatedTransaction.description).toBe('Edited Description');
      expect(updatedTransaction.category?.id).toBe(testCategoryId);
    });

    it('should handle rejection flow - delete unwanted transactions', async () => {
      // Create bulk transactions
      const bulkData = {
        transactions: [
          {
            date: new Date('2024-01-15'),
            amount: 100,
            type: 'EXPENSE' as const,
            description: 'Transaction to Keep',
            accountId: testAccountId,
          },
          {
            date: new Date('2024-01-16'),
            amount: 50,
            type: 'EXPENSE' as const,
            description: 'Transaction to Reject',
            accountId: testAccountId,
          },
        ],
      };

      const result = await transactionService.createBulkTransactions(bulkData, testUserId);
      expect(result).toHaveLength(2);

      // Simulate rejection - delete the unwanted transaction
      await transactionService.deleteTransaction(result[1].id, testUserId);

      // Verify only one transaction remains
      const transactions = await transactionService.getAllTransactions(testUserId);
      expect(transactions).toHaveLength(1);
      expect(transactions[0].description).toBe('Transaction to Keep');

      // Verify account balance reflects only the kept transaction
      const account = await accountService.getAccountById(testAccountId, testUserId);
      expect(account?.balance).toBe(-100);
    });

    it('should handle mixed approval - some approved, some rejected', async () => {
      const bulkData = {
        transactions: [
          {
            date: new Date('2024-01-15'),
            amount: 100,
            type: 'EXPENSE' as const,
            description: 'Transaction 1',
            accountId: testAccountId,
          },
          {
            date: new Date('2024-01-16'),
            amount: 200,
            type: 'INCOME' as const,
            description: 'Transaction 2',
            accountId: testAccountId,
          },
          {
            date: new Date('2024-01-17'),
            amount: 50,
            type: 'EXPENSE' as const,
            description: 'Transaction 3',
            accountId: testAccountId,
          },
        ],
      };

      const result = await transactionService.createBulkTransactions(bulkData, testUserId);
      expect(result).toHaveLength(3);

      // Reject transaction 2 (middle one)
      await transactionService.deleteTransaction(result[1].id, testUserId);

      // Verify remaining transactions
      const transactions = await transactionService.getAllTransactions(testUserId);
      expect(transactions).toHaveLength(2);

      // Verify account balance: -100 - 50 = -150 (transaction 2 was rejected)
      const account = await accountService.getAccountById(testAccountId, testUserId);
      expect(account?.balance).toBe(-150);
    });

    it('should validate bulk transaction data', async () => {
      const invalidBulkData = {
        transactions: [
          {
            date: new Date('2024-01-15'),
            amount: -100, // Invalid: negative amount
            type: 'EXPENSE' as const,
            description: 'Invalid Transaction',
            accountId: testAccountId,
          },
        ],
      };

      await expect(
        transactionService.createBulkTransactions(invalidBulkData, testUserId)
      ).rejects.toThrow();
    });

    it('should handle empty bulk transaction array', async () => {
      const emptyBulkData = {
        transactions: [],
      };

      await expect(
        transactionService.createBulkTransactions(emptyBulkData, testUserId)
      ).rejects.toThrow();
    });

    it('should create bulk transactions with tags', async () => {
      const tag = await prisma.tag.create({
        data: {
          name: 'Import Tag',
          userId: testUserId,
        },
      });

      const bulkData = {
        transactions: [
          {
            date: new Date('2024-01-15'),
            amount: 100,
            type: 'EXPENSE' as const,
            description: 'Tagged Transaction',
            accountId: testAccountId,
            tagIds: [tag.id],
          },
        ],
      };

      const result = await transactionService.createBulkTransactions(bulkData, testUserId);

      expect(result).toHaveLength(1);
      expect(result[0].tags).toHaveLength(1);
      expect(result[0].tags[0].tag.id).toBe(tag.id);
    });
  });
});
