import { PrismaClient } from '@prisma/client';
import * as reportService from '../reportService';
import * as accountService from '../accountService';
import * as transactionService from '../transactionService';

const prisma = new PrismaClient();

let testUserId: string;
let testAccountId: string;
let testCategoryId1: string;
let testCategoryId2: string;
let testCategoryId3: string;

beforeAll(async () => {
  // Create test user
  let testUser = await prisma.user.findUnique({
    where: { email: 'test@reportservice.test' },
  });

  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: 'test@reportservice.test',
        name: 'Test User',
      },
    });
  }
  
  testUserId = testUser.id;

  // Create test account
  const account = await accountService.createAccount({
    name: 'Test Account',
    type: 'CHECKING',
    userId: testUserId,
  });
  testAccountId = account.id;

  // Create test categories
  const category1 = await prisma.category.create({
    data: {
      name: 'Food',
      userId: testUserId,
    },
  });
  testCategoryId1 = category1.id;

  const category2 = await prisma.category.create({
    data: {
      name: 'Transport',
      userId: testUserId,
    },
  });
  testCategoryId2 = category2.id;

  const category3 = await prisma.category.create({
    data: {
      name: 'Salary',
      userId: testUserId,
    },
  });
  testCategoryId3 = category3.id;
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
  // Clean up transactions after each test
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

describe('Report Service', () => {
  describe('calculateMonthlySummary', () => {
    it('should calculate monthly summary with income and expenses', async () => {
      // Create test transactions
      await transactionService.createTransaction({
        date: new Date('2024-01-15'),
        amount: 3000,
        type: 'INCOME',
        description: 'Salary',
        accountId: testAccountId,
        categoryId: testCategoryId3,
        userId: testUserId,
      });

      await transactionService.createTransaction({
        date: new Date('2024-01-20'),
        amount: 500,
        type: 'EXPENSE',
        description: 'Groceries',
        accountId: testAccountId,
        categoryId: testCategoryId1,
        userId: testUserId,
      });

      await transactionService.createTransaction({
        date: new Date('2024-02-10'),
        amount: 3000,
        type: 'INCOME',
        description: 'Salary',
        accountId: testAccountId,
        categoryId: testCategoryId3,
        userId: testUserId,
      });

      await transactionService.createTransaction({
        date: new Date('2024-02-15'),
        amount: 200,
        type: 'EXPENSE',
        description: 'Gas',
        accountId: testAccountId,
        categoryId: testCategoryId2,
        userId: testUserId,
      });

      // Calculate summary
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-02-29');
      const summary = await reportService.calculateMonthlySummary(testUserId, startDate, endDate);

      // Verify results
      expect(summary).toHaveLength(2);
      
      // January
      expect(summary[0].month).toBe('2024-01');
      expect(summary[0].income).toBe(3000);
      expect(summary[0].expenses).toBe(500);
      expect(summary[0].netBalance).toBe(2500);
      expect(summary[0].transactionCount).toBe(2);

      // February
      expect(summary[1].month).toBe('2024-02');
      expect(summary[1].income).toBe(3000);
      expect(summary[1].expenses).toBe(200);
      expect(summary[1].netBalance).toBe(2800);
      expect(summary[1].transactionCount).toBe(2);
    });

    it('should exclude transfers from monthly summary', async () => {
      // Create second account for transfer
      const account2 = await accountService.createAccount({
        name: 'Savings Account ' + Date.now(),
        type: 'SAVINGS',
        userId: testUserId,
      });

      // Create income transaction
      await transactionService.createTransaction({
        date: new Date('2024-01-15'),
        amount: 3000,
        type: 'INCOME',
        description: 'Salary',
        accountId: testAccountId,
        categoryId: testCategoryId3,
        userId: testUserId,
      });

      // Create transfer (should be excluded)
      await transactionService.createTransfer({
        date: new Date('2024-01-20'),
        amount: 1000,
        description: 'Transfer to savings',
        fromAccountId: testAccountId,
        toAccountId: account2.id,
        userId: testUserId,
      });

      // Calculate summary
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const summary = await reportService.calculateMonthlySummary(testUserId, startDate, endDate);

      // Verify transfers are excluded
      expect(summary).toHaveLength(1);
      expect(summary[0].income).toBe(3000);
      expect(summary[0].expenses).toBe(0);
      expect(summary[0].netBalance).toBe(3000);
      expect(summary[0].transactionCount).toBe(1); // Only the income transaction
    });

    it('should handle split transactions correctly', async () => {
      // Create split transaction
      await transactionService.createSplitTransaction({
        date: new Date('2024-01-15'),
        amount: 150,
        type: 'EXPENSE',
        description: 'Shopping',
        accountId: testAccountId,
        userId: testUserId,
        items: [
          {
            amount: 100,
            description: 'Groceries',
            categoryId: testCategoryId1,
          },
          {
            amount: 50,
            description: 'Gas',
            categoryId: testCategoryId2,
          },
        ],
      });

      // Calculate summary
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const summary = await reportService.calculateMonthlySummary(testUserId, startDate, endDate);

      // Verify split transaction is counted correctly (using child amounts, not parent)
      expect(summary).toHaveLength(1);
      expect(summary[0].expenses).toBe(150); // Sum of child transactions
      expect(summary[0].transactionCount).toBe(2); // Two child transactions
    });
  });

  describe('calculateCategoryBreakdown', () => {
    it('should calculate expense breakdown by category', async () => {
      // Create test transactions
      await transactionService.createTransaction({
        date: new Date('2024-01-15'),
        amount: 500,
        type: 'EXPENSE',
        description: 'Groceries',
        accountId: testAccountId,
        categoryId: testCategoryId1,
        userId: testUserId,
      });

      await transactionService.createTransaction({
        date: new Date('2024-01-20'),
        amount: 300,
        type: 'EXPENSE',
        description: 'More groceries',
        accountId: testAccountId,
        categoryId: testCategoryId1,
        userId: testUserId,
      });

      await transactionService.createTransaction({
        date: new Date('2024-01-25'),
        amount: 200,
        type: 'EXPENSE',
        description: 'Gas',
        accountId: testAccountId,
        categoryId: testCategoryId2,
        userId: testUserId,
      });

      // Calculate breakdown
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const breakdown = await reportService.calculateCategoryBreakdown(
        testUserId,
        startDate,
        endDate,
        'EXPENSE'
      );

      // Verify results (sorted by amount descending)
      expect(breakdown).toHaveLength(2);
      
      // Food category (highest amount)
      expect(breakdown[0].categoryName).toBe('Food');
      expect(breakdown[0].amount).toBe(800);
      expect(breakdown[0].percentage).toBeCloseTo(80, 1);
      expect(breakdown[0].transactionCount).toBe(2);

      // Transport category
      expect(breakdown[1].categoryName).toBe('Transport');
      expect(breakdown[1].amount).toBe(200);
      expect(breakdown[1].percentage).toBeCloseTo(20, 1);
      expect(breakdown[1].transactionCount).toBe(1);
    });

    it('should calculate income breakdown by category', async () => {
      // Create test transactions
      await transactionService.createTransaction({
        date: new Date('2024-01-15'),
        amount: 3000,
        type: 'INCOME',
        description: 'Salary',
        accountId: testAccountId,
        categoryId: testCategoryId3,
        userId: testUserId,
      });

      await transactionService.createTransaction({
        date: new Date('2024-01-20'),
        amount: 500,
        type: 'INCOME',
        description: 'Freelance',
        accountId: testAccountId,
        categoryId: testCategoryId1, // Using Food category for freelance
        userId: testUserId,
      });

      // Calculate breakdown
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const breakdown = await reportService.calculateCategoryBreakdown(
        testUserId,
        startDate,
        endDate,
        'INCOME'
      );

      // Verify results
      expect(breakdown).toHaveLength(2);
      expect(breakdown[0].categoryName).toBe('Salary');
      expect(breakdown[0].amount).toBe(3000);
      expect(breakdown[1].categoryName).toBe('Food');
      expect(breakdown[1].amount).toBe(500);
    });

    it('should handle split transactions in category breakdown', async () => {
      // Create split transaction
      await transactionService.createSplitTransaction({
        date: new Date('2024-01-15'),
        amount: 150,
        type: 'EXPENSE',
        description: 'Shopping',
        accountId: testAccountId,
        userId: testUserId,
        items: [
          {
            amount: 100,
            description: 'Groceries',
            categoryId: testCategoryId1,
          },
          {
            amount: 50,
            description: 'Gas',
            categoryId: testCategoryId2,
          },
        ],
      });

      // Calculate breakdown
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const breakdown = await reportService.calculateCategoryBreakdown(
        testUserId,
        startDate,
        endDate,
        'EXPENSE'
      );

      // Verify split items are counted in their respective categories
      expect(breakdown).toHaveLength(2);
      
      const foodCategory = breakdown.find(b => b.categoryName === 'Food');
      expect(foodCategory).toBeDefined();
      expect(foodCategory?.amount).toBe(100);

      const transportCategory = breakdown.find(b => b.categoryName === 'Transport');
      expect(transportCategory).toBeDefined();
      expect(transportCategory?.amount).toBe(50);
    });

    it('should handle uncategorized transactions', async () => {
      // Create transaction without category
      await transactionService.createTransaction({
        date: new Date('2024-01-15'),
        amount: 100,
        type: 'EXPENSE',
        description: 'Misc expense',
        accountId: testAccountId,
        userId: testUserId,
      });

      // Calculate breakdown
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const breakdown = await reportService.calculateCategoryBreakdown(
        testUserId,
        startDate,
        endDate,
        'EXPENSE'
      );

      // Verify uncategorized is included
      expect(breakdown).toHaveLength(1);
      expect(breakdown[0].categoryName).toBe('Uncategorized');
      expect(breakdown[0].categoryId).toBeNull();
      expect(breakdown[0].amount).toBe(100);
    });
  });

  describe('calculateNetBalanceOverTime', () => {
    it('should calculate net balance over time with cumulative balance', async () => {
      // Create transactions across multiple months
      await transactionService.createTransaction({
        date: new Date('2024-01-15'),
        amount: 3000,
        type: 'INCOME',
        description: 'Salary',
        accountId: testAccountId,
        categoryId: testCategoryId3,
        userId: testUserId,
      });

      await transactionService.createTransaction({
        date: new Date('2024-01-20'),
        amount: 500,
        type: 'EXPENSE',
        description: 'Groceries',
        accountId: testAccountId,
        categoryId: testCategoryId1,
        userId: testUserId,
      });

      await transactionService.createTransaction({
        date: new Date('2024-02-15'),
        amount: 3000,
        type: 'INCOME',
        description: 'Salary',
        accountId: testAccountId,
        categoryId: testCategoryId3,
        userId: testUserId,
      });

      await transactionService.createTransaction({
        date: new Date('2024-02-20'),
        amount: 800,
        type: 'EXPENSE',
        description: 'Rent',
        accountId: testAccountId,
        categoryId: testCategoryId2,
        userId: testUserId,
      });

      // Calculate net balance over time
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-02-29');
      const netBalance = await reportService.calculateNetBalanceOverTime(
        testUserId,
        startDate,
        endDate
      );

      // Verify results
      expect(netBalance).toHaveLength(2);
      
      // January
      expect(netBalance[0].month).toBe('2024-01');
      expect(netBalance[0].netBalance).toBe(2500); // 3000 - 500
      expect(netBalance[0].cumulativeBalance).toBe(2500);

      // February
      expect(netBalance[1].month).toBe('2024-02');
      expect(netBalance[1].netBalance).toBe(2200); // 3000 - 800
      expect(netBalance[1].cumulativeBalance).toBe(4700); // 2500 + 2200
    });

    it('should exclude transfers from net balance calculation', async () => {
      // Create second account for transfer
      const account2 = await accountService.createAccount({
        name: 'Savings Account ' + Date.now(),
        type: 'SAVINGS',
        userId: testUserId,
      });

      // Create income
      await transactionService.createTransaction({
        date: new Date('2024-01-15'),
        amount: 3000,
        type: 'INCOME',
        description: 'Salary',
        accountId: testAccountId,
        categoryId: testCategoryId3,
        userId: testUserId,
      });

      // Create transfer (should be excluded)
      await transactionService.createTransfer({
        date: new Date('2024-01-20'),
        amount: 1000,
        description: 'Transfer to savings',
        fromAccountId: testAccountId,
        toAccountId: account2.id,
        userId: testUserId,
      });

      // Calculate net balance
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const netBalance = await reportService.calculateNetBalanceOverTime(
        testUserId,
        startDate,
        endDate
      );

      // Verify transfers are excluded
      expect(netBalance).toHaveLength(1);
      expect(netBalance[0].netBalance).toBe(3000); // Only income, no transfer
      expect(netBalance[0].cumulativeBalance).toBe(3000);
    });
  });

  describe('getComprehensiveReport', () => {
    it('should return comprehensive report with all components', async () => {
      // Create test transactions
      await transactionService.createTransaction({
        date: new Date('2024-01-15'),
        amount: 3000,
        type: 'INCOME',
        description: 'Salary',
        accountId: testAccountId,
        categoryId: testCategoryId3,
        userId: testUserId,
      });

      await transactionService.createTransaction({
        date: new Date('2024-01-20'),
        amount: 500,
        type: 'EXPENSE',
        description: 'Groceries',
        accountId: testAccountId,
        categoryId: testCategoryId1,
        userId: testUserId,
      });

      await transactionService.createTransaction({
        date: new Date('2024-01-25'),
        amount: 200,
        type: 'EXPENSE',
        description: 'Gas',
        accountId: testAccountId,
        categoryId: testCategoryId2,
        userId: testUserId,
      });

      // Get comprehensive report
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const report = await reportService.getComprehensiveReport(testUserId, startDate, endDate);

      // Verify all components are present
      expect(report.summary).toHaveLength(1);
      expect(report.expenseBreakdown).toHaveLength(2);
      expect(report.incomeBreakdown).toHaveLength(1);
      expect(report.netBalanceTrend).toHaveLength(1);

      // Verify totals
      expect(report.totals.totalIncome).toBe(3000);
      expect(report.totals.totalExpenses).toBe(700);
      expect(report.totals.totalNetBalance).toBe(2300);
      expect(report.totals.totalTransactions).toBe(3);
    });
  });
});
