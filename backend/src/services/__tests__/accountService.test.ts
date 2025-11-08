import { PrismaClient } from '@prisma/client';
import * as accountService from '../accountService';

const prisma = new PrismaClient();

// Test user ID
let testUserId: string;

beforeAll(async () => {
  // Find or create a test user
  let testUser = await prisma.user.findUnique({
    where: { email: 'test@accountservice.test' },
  });

  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: 'test@accountservice.test',
        name: 'Test User',
      },
    });
  }
  
  testUserId = testUser.id;
});

afterAll(async () => {
  // Clean up test data - delete in correct order due to foreign keys
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
    await prisma.transaction.deleteMany({ where: { userId: testUserId } });
    await prisma.account.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
  }
  await prisma.$disconnect();
});

afterEach(async () => {
  // Clean up accounts after each test - delete in correct order due to foreign keys
  const accounts = await prisma.account.findMany({ where: { userId: testUserId } });
  const accountIds = accounts.map(a => a.id);
  
  await prisma.transfer.deleteMany({
    where: {
      OR: [
        { fromAccountId: { in: accountIds } },
        { toAccountId: { in: accountIds } },
      ],
    },
  });
  await prisma.transaction.deleteMany({ where: { userId: testUserId } });
  await prisma.account.deleteMany({ where: { userId: testUserId } });
});

describe('Account Service', () => {
  describe('createAccount', () => {
    it('should create an account with valid data', async () => {
      const accountData = {
        name: 'Test Checking',
        type: 'CHECKING' as const,
        userId: testUserId,
      };

      const account = await accountService.createAccount(accountData);

      expect(account).toBeDefined();
      expect(account.id).toBeDefined();
      expect(account.name).toBe('Test Checking');
      expect(account.type).toBe('CHECKING');
      expect(account.balance).toBe(0);
      expect(account.userId).toBe(testUserId);
    });

    it('should throw error when creating account with empty name', async () => {
      const accountData = {
        name: '',
        type: 'CHECKING' as const,
        userId: testUserId,
      };

      await expect(accountService.createAccount(accountData)).rejects.toThrow();
    });

    it('should throw error when creating account with invalid type', async () => {
      const accountData = {
        name: 'Test Account',
        type: 'INVALID_TYPE' as any,
        userId: testUserId,
      };

      await expect(accountService.createAccount(accountData)).rejects.toThrow();
    });

    it('should throw error when creating account with duplicate name', async () => {
      const accountData = {
        name: 'Duplicate Account',
        type: 'CHECKING' as const,
        userId: testUserId,
      };

      // Create first account
      await accountService.createAccount(accountData);

      // Try to create duplicate
      await expect(accountService.createAccount(accountData)).rejects.toThrow(
        'An account with this name already exists'
      );
    });

    it('should allow same account name for different users', async () => {
      // Create another test user
      const anotherUser = await prisma.user.create({
        data: {
          email: 'another@accountservice.test',
          name: 'Another User',
        },
      });

      const accountData1 = {
        name: 'Shared Name',
        type: 'CHECKING' as const,
        userId: testUserId,
      };

      const accountData2 = {
        name: 'Shared Name',
        type: 'SAVINGS' as const,
        userId: anotherUser.id,
      };

      const account1 = await accountService.createAccount(accountData1);
      const account2 = await accountService.createAccount(accountData2);

      expect(account1.name).toBe('Shared Name');
      expect(account2.name).toBe('Shared Name');
      expect(account1.userId).not.toBe(account2.userId);

      // Clean up
      await prisma.account.delete({ where: { id: account2.id } });
      await prisma.user.delete({ where: { id: anotherUser.id } });
    });
  });

  describe('updateAccount', () => {
    it('should update account name', async () => {
      const account = await accountService.createAccount({
        name: 'Original Name',
        type: 'CHECKING',
        userId: testUserId,
      });

      const updated = await accountService.updateAccount(account.id, testUserId, {
        name: 'Updated Name',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.type).toBe('CHECKING');
    });

    it('should update account type', async () => {
      const account = await accountService.createAccount({
        name: 'Test Account',
        type: 'CHECKING',
        userId: testUserId,
      });

      const updated = await accountService.updateAccount(account.id, testUserId, {
        type: 'SAVINGS',
      });

      expect(updated.type).toBe('SAVINGS');
      expect(updated.name).toBe('Test Account');
    });

    it('should update both name and type', async () => {
      const account = await accountService.createAccount({
        name: 'Original',
        type: 'CHECKING',
        userId: testUserId,
      });

      const updated = await accountService.updateAccount(account.id, testUserId, {
        name: 'Updated',
        type: 'CREDIT_CARD',
      });

      expect(updated.name).toBe('Updated');
      expect(updated.type).toBe('CREDIT_CARD');
    });

    it('should throw error when updating to duplicate name', async () => {
      await accountService.createAccount({
        name: 'Account 1',
        type: 'CHECKING',
        userId: testUserId,
      });

      const account2 = await accountService.createAccount({
        name: 'Account 2',
        type: 'SAVINGS',
        userId: testUserId,
      });

      await expect(
        accountService.updateAccount(account2.id, testUserId, { name: 'Account 1' })
      ).rejects.toThrow('An account with this name already exists');
    });

    it('should throw error when updating non-existent account', async () => {
      await expect(
        accountService.updateAccount('non-existent-id', testUserId, { name: 'New Name' })
      ).rejects.toThrow('Account not found');
    });

    it('should throw error when updating account of different user', async () => {
      const anotherUser = await prisma.user.create({
        data: {
          email: 'other@accountservice.test',
          name: 'Other User',
        },
      });

      const account = await accountService.createAccount({
        name: 'Test Account',
        type: 'CHECKING',
        userId: anotherUser.id,
      });

      await expect(
        accountService.updateAccount(account.id, testUserId, { name: 'Hacked Name' })
      ).rejects.toThrow('Account not found');

      // Clean up
      await prisma.account.delete({ where: { id: account.id } });
      await prisma.user.delete({ where: { id: anotherUser.id } });
    });
  });

  describe('deleteAccount', () => {
    it('should delete account without transactions', async () => {
      const account = await accountService.createAccount({
        name: 'To Delete',
        type: 'CHECKING',
        userId: testUserId,
      });

      await accountService.deleteAccount(account.id, testUserId);

      const deleted = await accountService.getAccountById(account.id, testUserId);
      expect(deleted).toBeNull();
    });

    it('should throw error when deleting account with transactions', async () => {
      const account = await accountService.createAccount({
        name: 'With Transactions',
        type: 'CHECKING',
        userId: testUserId,
      });

      // Create a transaction
      await prisma.transaction.create({
        data: {
          date: new Date(),
          amount: 100,
          type: 'INCOME',
          description: 'Test transaction',
          accountId: account.id,
          userId: testUserId,
        },
      });

      await expect(accountService.deleteAccount(account.id, testUserId)).rejects.toThrow(
        'Cannot delete account with existing transactions'
      );
    });

    it('should throw error when deleting account with transfers', async () => {
      const account1 = await accountService.createAccount({
        name: 'Account 1',
        type: 'CHECKING',
        userId: testUserId,
      });

      const account2 = await accountService.createAccount({
        name: 'Account 2',
        type: 'SAVINGS',
        userId: testUserId,
      });

      // Create a transfer transaction
      const transaction = await prisma.transaction.create({
        data: {
          date: new Date(),
          amount: 50,
          type: 'TRANSFER',
          description: 'Transfer',
          accountId: account1.id,
          userId: testUserId,
        },
      });

      // Create transfer record
      await prisma.transfer.create({
        data: {
          transactionId: transaction.id,
          fromAccountId: account1.id,
          toAccountId: account2.id,
        },
      });

      // The service checks transactions first, so it will throw the transaction error
      await expect(accountService.deleteAccount(account1.id, testUserId)).rejects.toThrow(
        'Cannot delete account with existing transactions'
      );
    });

    it('should throw error when deleting non-existent account', async () => {
      await expect(accountService.deleteAccount('non-existent-id', testUserId)).rejects.toThrow(
        'Account not found'
      );
    });

    it('should throw error when deleting account of different user', async () => {
      const anotherUser = await prisma.user.create({
        data: {
          email: 'delete@accountservice.test',
          name: 'Delete User',
        },
      });

      const account = await accountService.createAccount({
        name: 'Protected Account',
        type: 'CHECKING',
        userId: anotherUser.id,
      });

      await expect(accountService.deleteAccount(account.id, testUserId)).rejects.toThrow(
        'Account not found'
      );

      // Clean up
      await prisma.account.delete({ where: { id: account.id } });
      await prisma.user.delete({ where: { id: anotherUser.id } });
    });
  });

  describe('calculateAccountBalance', () => {
    it('should calculate balance with income transactions', async () => {
      const account = await accountService.createAccount({
        name: 'Income Account',
        type: 'CHECKING',
        userId: testUserId,
      });

      await prisma.transaction.createMany({
        data: [
          {
            date: new Date(),
            amount: 100,
            type: 'INCOME',
            description: 'Income 1',
            accountId: account.id,
            userId: testUserId,
          },
          {
            date: new Date(),
            amount: 50,
            type: 'INCOME',
            description: 'Income 2',
            accountId: account.id,
            userId: testUserId,
          },
        ],
      });

      const balance = await accountService.calculateAccountBalance(account.id);
      expect(balance).toBe(150);
    });

    it('should calculate balance with expense transactions', async () => {
      const account = await accountService.createAccount({
        name: 'Expense Account',
        type: 'CHECKING',
        userId: testUserId,
      });

      await prisma.transaction.createMany({
        data: [
          {
            date: new Date(),
            amount: 100,
            type: 'EXPENSE',
            description: 'Expense 1',
            accountId: account.id,
            userId: testUserId,
          },
          {
            date: new Date(),
            amount: 30,
            type: 'EXPENSE',
            description: 'Expense 2',
            accountId: account.id,
            userId: testUserId,
          },
        ],
      });

      const balance = await accountService.calculateAccountBalance(account.id);
      expect(balance).toBe(-130);
    });

    it('should calculate balance with mixed transactions', async () => {
      const account = await accountService.createAccount({
        name: 'Mixed Account',
        type: 'CHECKING',
        userId: testUserId,
      });

      await prisma.transaction.createMany({
        data: [
          {
            date: new Date(),
            amount: 1000,
            type: 'INCOME',
            description: 'Salary',
            accountId: account.id,
            userId: testUserId,
          },
          {
            date: new Date(),
            amount: 200,
            type: 'EXPENSE',
            description: 'Groceries',
            accountId: account.id,
            userId: testUserId,
          },
          {
            date: new Date(),
            amount: 150,
            type: 'EXPENSE',
            description: 'Utilities',
            accountId: account.id,
            userId: testUserId,
          },
        ],
      });

      const balance = await accountService.calculateAccountBalance(account.id);
      expect(balance).toBe(650);
    });

    it('should exclude parent transactions from split transactions', async () => {
      const account = await accountService.createAccount({
        name: 'Split Account',
        type: 'CHECKING',
        userId: testUserId,
      });

      // Create parent transaction
      const parent = await prisma.transaction.create({
        data: {
          date: new Date(),
          amount: 100,
          type: 'EXPENSE',
          description: 'Parent',
          accountId: account.id,
          userId: testUserId,
          isParent: true,
        },
      });

      // Create child transactions
      await prisma.transaction.createMany({
        data: [
          {
            date: new Date(),
            amount: 60,
            type: 'EXPENSE',
            description: 'Child 1',
            accountId: account.id,
            userId: testUserId,
            parentId: parent.id,
          },
          {
            date: new Date(),
            amount: 40,
            type: 'EXPENSE',
            description: 'Child 2',
            accountId: account.id,
            userId: testUserId,
            parentId: parent.id,
          },
        ],
      });

      const balance = await accountService.calculateAccountBalance(account.id);
      // Should only count children (60 + 40 = 100), not parent
      expect(balance).toBe(-100);
    });

    it('should handle transfer transactions correctly', async () => {
      const account1 = await accountService.createAccount({
        name: 'Transfer From',
        type: 'CHECKING',
        userId: testUserId,
      });

      const account2 = await accountService.createAccount({
        name: 'Transfer To',
        type: 'SAVINGS',
        userId: testUserId,
      });

      // Create transfer transaction for account1 (debit)
      const transaction1 = await prisma.transaction.create({
        data: {
          date: new Date(),
          amount: 100,
          type: 'TRANSFER',
          description: 'Transfer out',
          accountId: account1.id,
          userId: testUserId,
        },
      });

      await prisma.transfer.create({
        data: {
          transactionId: transaction1.id,
          fromAccountId: account1.id,
          toAccountId: account2.id,
        },
      });

      // Create transfer transaction for account2 (credit)
      const transaction2 = await prisma.transaction.create({
        data: {
          date: new Date(),
          amount: 100,
          type: 'TRANSFER',
          description: 'Transfer in',
          accountId: account2.id,
          userId: testUserId,
        },
      });

      await prisma.transfer.create({
        data: {
          transactionId: transaction2.id,
          fromAccountId: account1.id,
          toAccountId: account2.id,
        },
      });

      const balance1 = await accountService.calculateAccountBalance(account1.id);
      const balance2 = await accountService.calculateAccountBalance(account2.id);

      expect(balance1).toBe(-100); // Debit
      expect(balance2).toBe(100); // Credit
    });

    it('should return 0 for account with no transactions', async () => {
      const account = await accountService.createAccount({
        name: 'Empty Account',
        type: 'CHECKING',
        userId: testUserId,
      });

      const balance = await accountService.calculateAccountBalance(account.id);
      expect(balance).toBe(0);
    });
  });

  describe('getAllAccounts', () => {
    it('should return all accounts for a user', async () => {
      await accountService.createAccount({
        name: 'Account 1',
        type: 'CHECKING',
        userId: testUserId,
      });

      await accountService.createAccount({
        name: 'Account 2',
        type: 'SAVINGS',
        userId: testUserId,
      });

      const accounts = await accountService.getAllAccounts(testUserId);
      expect(accounts).toHaveLength(2);
      expect(accounts[0].name).toBe('Account 1');
      expect(accounts[1].name).toBe('Account 2');
    });

    it('should return empty array when user has no accounts', async () => {
      const accounts = await accountService.getAllAccounts(testUserId);
      expect(accounts).toHaveLength(0);
    });
  });

  describe('getAccountById', () => {
    it('should return account when it exists', async () => {
      const created = await accountService.createAccount({
        name: 'Test Account',
        type: 'CHECKING',
        userId: testUserId,
      });

      const account = await accountService.getAccountById(created.id, testUserId);
      expect(account).toBeDefined();
      expect(account?.id).toBe(created.id);
      expect(account?.name).toBe('Test Account');
    });

    it('should return null when account does not exist', async () => {
      const account = await accountService.getAccountById('non-existent-id', testUserId);
      expect(account).toBeNull();
    });

    it('should return null when account belongs to different user', async () => {
      const anotherUser = await prisma.user.create({
        data: {
          email: 'getbyid@accountservice.test',
          name: 'GetById User',
        },
      });

      const account = await accountService.createAccount({
        name: 'Other User Account',
        type: 'CHECKING',
        userId: anotherUser.id,
      });

      const result = await accountService.getAccountById(account.id, testUserId);
      expect(result).toBeNull();

      // Clean up
      await prisma.account.delete({ where: { id: account.id } });
      await prisma.user.delete({ where: { id: anotherUser.id } });
    });
  });
});
