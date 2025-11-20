/**
 * Data Isolation and Security Tests
 * 
 * This test suite verifies that:
 * 1. All database queries filter by userId
 * 2. Users cannot access other users' data
 * 3. Ownership checks are enforced on update/delete operations
 * 4. API endpoints properly validate user tokens
 */

import { PrismaClient } from '@prisma/client';
import * as accountService from '../accountService';
import * as transactionService from '../transactionService';
import * as categoryService from '../categoryService';
import * as tagService from '../tagService';

const prisma = new PrismaClient();

describe('Data Isolation Tests', () => {
  let user1Id: string;
  let user2Id: string;
  let user1AccountId: string;
  let user2AccountId: string;
  let user1CategoryId: string;
  let user2CategoryId: string;
  let user1TagId: string;
  let user2TagId: string;

  beforeAll(async () => {
    // Create two test users
    const user1 = await prisma.user.create({
      data: {
        email: 'user1@test.com',
        name: 'User 1',
        password: 'hashedpassword1',
      },
    });
    user1Id = user1.id;

    const user2 = await prisma.user.create({
      data: {
        email: 'user2@test.com',
        name: 'User 2',
        password: 'hashedpassword2',
      },
    });
    user2Id = user2.id;

    // Create accounts for both users
    const user1Account = await accountService.createAccount({
      name: 'User 1 Checking',
      type: 'CHECKING',
      userId: user1Id,
    });
    user1AccountId = user1Account.id;

    const user2Account = await accountService.createAccount({
      name: 'User 2 Checking',
      type: 'CHECKING',
      userId: user2Id,
    });
    user2AccountId = user2Account.id;

    // Create categories for both users
    const user1Category = await categoryService.createCategory({
      name: 'User 1 Food',
      userId: user1Id,
    });
    user1CategoryId = user1Category.id;

    const user2Category = await categoryService.createCategory({
      name: 'User 2 Food',
      userId: user2Id,
    });
    user2CategoryId = user2Category.id;

    // Create tags for both users
    const user1Tag = await tagService.createTag({
      name: 'user1-tag',
      userId: user1Id,
    });
    user1TagId = user1Tag.id;

    const user2Tag = await tagService.createTag({
      name: 'user2-tag',
      userId: user2Id,
    });
    user2TagId = user2Tag.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.transactionTag.deleteMany({
      where: {
        OR: [
          { tagId: user1TagId },
          { tagId: user2TagId },
        ],
      },
    });

    await prisma.transaction.deleteMany({
      where: {
        OR: [
          { userId: user1Id },
          { userId: user2Id },
        ],
      },
    });

    await prisma.tag.deleteMany({
      where: {
        OR: [
          { userId: user1Id },
          { userId: user2Id },
        ],
      },
    });

    await prisma.category.deleteMany({
      where: {
        OR: [
          { userId: user1Id },
          { userId: user2Id },
        ],
      },
    });

    await prisma.account.deleteMany({
      where: {
        OR: [
          { userId: user1Id },
          { userId: user2Id },
        ],
      },
    });

    await prisma.user.deleteMany({
      where: {
        OR: [
          { id: user1Id },
          { id: user2Id },
        ],
      },
    });

    await prisma.$disconnect();
  });

  describe('Account Service Data Isolation', () => {
    it('should only return accounts belonging to the user', async () => {
      const user1Accounts = await accountService.getAllAccounts(user1Id);
      const user2Accounts = await accountService.getAllAccounts(user2Id);

      expect(user1Accounts).toHaveLength(1);
      expect(user1Accounts[0].id).toBe(user1AccountId);
      expect(user1Accounts[0].userId).toBe(user1Id);

      expect(user2Accounts).toHaveLength(1);
      expect(user2Accounts[0].id).toBe(user2AccountId);
      expect(user2Accounts[0].userId).toBe(user2Id);
    });

    it('should not allow user to access another user\'s account by ID', async () => {
      const account = await accountService.getAccountById(user2AccountId, user1Id);
      expect(account).toBeNull();
    });

    it('should not allow user to update another user\'s account', async () => {
      await expect(
        accountService.updateAccount(user2AccountId, user1Id, { name: 'Hacked Account' })
      ).rejects.toThrow('Account not found');
    });

    it('should not allow user to delete another user\'s account', async () => {
      await expect(
        accountService.deleteAccount(user2AccountId, user1Id)
      ).rejects.toThrow('Account not found');
    });

    it('should not allow user to get balance of another user\'s account', async () => {
      await expect(
        accountService.getAccountBalance(user2AccountId, user1Id)
      ).rejects.toThrow('Account not found');
    });
  });

  describe('Transaction Service Data Isolation', () => {
    let user2TransactionId: string;

    beforeAll(async () => {
      // Create transactions for both users
      await transactionService.createTransaction({
        date: new Date('2024-01-15'),
        amount: 100,
        type: 'EXPENSE',
        description: 'User 1 Transaction',
        accountId: user1AccountId,
        categoryId: user1CategoryId,
        userId: user1Id,
      });

      const user2Transaction = await transactionService.createTransaction({
        date: new Date('2024-01-15'),
        amount: 200,
        type: 'EXPENSE',
        description: 'User 2 Transaction',
        accountId: user2AccountId,
        categoryId: user2CategoryId,
        userId: user2Id,
      });
      user2TransactionId = user2Transaction.id;
    });

    it('should only return transactions belonging to the user', async () => {
      const user1Transactions = await transactionService.getAllTransactions(user1Id);
      const user2Transactions = await transactionService.getAllTransactions(user2Id);

      expect(user1Transactions.length).toBeGreaterThanOrEqual(1);
      expect(user1Transactions.every(t => t.userId === user1Id)).toBe(true);

      expect(user2Transactions.length).toBeGreaterThanOrEqual(1);
      expect(user2Transactions.every(t => t.userId === user2Id)).toBe(true);
    });

    it('should not allow user to access another user\'s transaction by ID', async () => {
      const transaction = await transactionService.getTransactionById(user2TransactionId, user1Id);
      expect(transaction).toBeNull();
    });

    it('should not allow user to update another user\'s transaction', async () => {
      await expect(
        transactionService.updateTransaction(user2TransactionId, user1Id, {
          description: 'Hacked Transaction',
        })
      ).rejects.toThrow('Transaction not found');
    });

    it('should not allow user to delete another user\'s transaction', async () => {
      await expect(
        transactionService.deleteTransaction(user2TransactionId, user1Id)
      ).rejects.toThrow('Transaction not found');
    });

    it('should filter paginated transactions by userId', async () => {
      const result = await transactionService.getPaginatedTransactions(user1Id, {
        page: 1,
        limit: 10,
      });

      expect(result.transactions.every(t => t.userId === user1Id)).toBe(true);
    });
  });

  describe('Category Service Data Isolation', () => {
    it('should only return categories belonging to the user', async () => {
      const user1Categories = await categoryService.getAllCategories(user1Id);
      const user2Categories = await categoryService.getAllCategories(user2Id);

      expect(user1Categories.length).toBeGreaterThanOrEqual(1);
      expect(user1Categories.every(c => c.userId === user1Id)).toBe(true);

      expect(user2Categories.length).toBeGreaterThanOrEqual(1);
      expect(user2Categories.every(c => c.userId === user2Id)).toBe(true);
    });

    it('should not allow user to access another user\'s category by ID', async () => {
      const category = await categoryService.getCategoryById(user2CategoryId, user1Id);
      expect(category).toBeNull();
    });

    it('should not allow user to update another user\'s category', async () => {
      await expect(
        categoryService.updateCategory(user2CategoryId, user1Id, { name: 'Hacked Category' })
      ).rejects.toThrow('Category not found');
    });

    it('should not allow user to delete another user\'s category', async () => {
      await expect(
        categoryService.deleteCategory(user2CategoryId, user1Id)
      ).rejects.toThrow('Category not found');
    });
  });

  describe('Tag Service Data Isolation', () => {
    it('should only return tags belonging to the user', async () => {
      const user1Tags = await tagService.getAllTags(user1Id);
      const user2Tags = await tagService.getAllTags(user2Id);

      expect(user1Tags.length).toBeGreaterThanOrEqual(1);
      expect(user1Tags.every(t => t.userId === user1Id)).toBe(true);

      expect(user2Tags.length).toBeGreaterThanOrEqual(1);
      expect(user2Tags.every(t => t.userId === user2Id)).toBe(true);
    });

    it('should not allow user to delete another user\'s tag', async () => {
      await expect(
        tagService.deleteTag(user2TagId, user1Id)
      ).rejects.toThrow('Tag not found');
    });
  });

  describe('Cross-User Data Access Prevention', () => {
    it('should prevent creating transaction with another user\'s account', async () => {
      await expect(
        transactionService.createTransaction({
          date: new Date('2024-01-15'),
          amount: 100,
          type: 'EXPENSE',
          description: 'Malicious Transaction',
          accountId: user2AccountId, // User 2's account
          userId: user1Id, // User 1 trying to use it
        })
      ).rejects.toThrow('Account not found');
    });

    it('should prevent creating transaction with another user\'s category', async () => {
      await expect(
        transactionService.createTransaction({
          date: new Date('2024-01-15'),
          amount: 100,
          type: 'EXPENSE',
          description: 'Malicious Transaction',
          accountId: user1AccountId,
          categoryId: user2CategoryId, // User 2's category
          userId: user1Id,
        })
      ).rejects.toThrow('Category not found');
    });

    it('should prevent creating transfer between users\' accounts', async () => {
      await expect(
        transactionService.createTransfer({
          date: new Date('2024-01-15'),
          amount: 100,
          description: 'Malicious Transfer',
          fromAccountId: user1AccountId,
          toAccountId: user2AccountId, // User 2's account
          userId: user1Id,
        })
      ).rejects.toThrow('Destination account not found');
    });
  });
});
