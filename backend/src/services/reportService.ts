import { PrismaClient } from '@prisma/client';
import { TransactionType } from '../types/enums';

const prisma = new PrismaClient();

export interface MonthlySummary {
  month: string; // Format: YYYY-MM
  income: number;
  expenses: number;
  netBalance: number;
  transactionCount: number;
}

export interface CategoryBreakdown {
  categoryId: string | null;
  categoryName: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  parentCategoryId?: string | null;
  parentCategoryName?: string | null;
}

export interface NetBalancePoint {
  month: string; // Format: YYYY-MM
  netBalance: number;
  cumulativeBalance: number;
}

/**
 * Calculate monthly summary for a given date range
 * Excludes transfers from income/expense calculations
 * Handles split transactions by using child transaction amounts
 */
export async function calculateMonthlySummary(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<MonthlySummary[]> {
  // Get all transactions in the date range (excluding parent split transactions)
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
      // Exclude parent transactions - we only count child transactions for split transactions
      isParent: false,
    },
    select: {
      date: true,
      amount: true,
      type: true,
    },
    orderBy: {
      date: 'asc',
    },
  });

  // Group transactions by month
  const monthlyData = new Map<string, { income: number; expenses: number; count: number }>();

  for (const transaction of transactions) {
    // Skip transfers
    if (transaction.type === TransactionType.TRANSFER) {
      continue;
    }

    // Format month as YYYY-MM
    const month = transaction.date.toISOString().substring(0, 7);

    // Get or initialize month data
    if (!monthlyData.has(month)) {
      monthlyData.set(month, { income: 0, expenses: 0, count: 0 });
    }

    const data = monthlyData.get(month)!;

    // Add to appropriate total
    if (transaction.type === TransactionType.INCOME) {
      data.income += Number(transaction.amount);
    } else if (transaction.type === TransactionType.EXPENSE) {
      data.expenses += Number(transaction.amount);
    }

    data.count++;
  }

  // Convert to array and calculate net balance
  const summaries: MonthlySummary[] = [];
  for (const [month, data] of monthlyData.entries()) {
    summaries.push({
      month,
      income: data.income,
      expenses: data.expenses,
      netBalance: data.income - data.expenses,
      transactionCount: data.count,
    });
  }

  // Sort by month
  summaries.sort((a, b) => a.month.localeCompare(b.month));

  return summaries;
}

/**
 * Calculate category breakdown for expenses in a given date range
 * Excludes transfers
 * Handles split transactions by using child transaction categories
 */
export async function calculateCategoryBreakdown(
  userId: string,
  startDate: Date,
  endDate: Date,
  type: 'INCOME' | 'EXPENSE' = 'EXPENSE'
): Promise<CategoryBreakdown[]> {
  // Get all expense/income transactions in the date range (excluding parent split transactions)
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
      type,
      // Exclude parent transactions - we only count child transactions for split transactions
      isParent: false,
    },
    select: {
      amount: true,
      categoryId: true,
      category: {
        select: {
          id: true,
          name: true,
          parentId: true,
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  // Calculate total for percentage calculation
  const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  // Group by category
  const categoryData = new Map<
    string,
    {
      name: string;
      amount: number;
      count: number;
      parentId?: string | null;
      parentName?: string | null;
    }
  >();

  for (const transaction of transactions) {
    const categoryId = transaction.categoryId || 'uncategorized';
    const categoryName = transaction.category?.name || 'Uncategorized';
    const parentId = transaction.category?.parentId;
    const parentName = transaction.category?.parent?.name;

    if (!categoryData.has(categoryId)) {
      categoryData.set(categoryId, {
        name: categoryName,
        amount: 0,
        count: 0,
        parentId,
        parentName,
      });
    }

    const data = categoryData.get(categoryId)!;
    data.amount += Number(transaction.amount);
    data.count++;
  }

  // Convert to array and calculate percentages
  const breakdown: CategoryBreakdown[] = [];
  for (const [categoryId, data] of categoryData.entries()) {
    breakdown.push({
      categoryId: categoryId === 'uncategorized' ? null : categoryId,
      categoryName: data.name,
      amount: data.amount,
      percentage: total > 0 ? (data.amount / total) * 100 : 0,
      transactionCount: data.count,
      parentCategoryId: data.parentId,
      parentCategoryName: data.parentName,
    });
  }

  // Sort by amount descending
  breakdown.sort((a, b) => b.amount - a.amount);

  return breakdown;
}

/**
 * Calculate net balance over time (monthly)
 * Excludes transfers from calculations
 * Returns both monthly net balance and cumulative balance
 */
export async function calculateNetBalanceOverTime(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<NetBalancePoint[]> {
  // Get monthly summaries
  const monthlySummaries = await calculateMonthlySummary(userId, startDate, endDate);

  // Calculate cumulative balance
  let cumulativeBalance = 0;
  const netBalancePoints: NetBalancePoint[] = [];

  for (const summary of monthlySummaries) {
    cumulativeBalance += summary.netBalance;

    netBalancePoints.push({
      month: summary.month,
      netBalance: summary.netBalance,
      cumulativeBalance,
    });
  }

  return netBalancePoints;
}

/**
 * Get a comprehensive report summary for a date range
 * Includes monthly summary, category breakdown, and net balance trend
 */
export async function getComprehensiveReport(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  summary: MonthlySummary[];
  expenseBreakdown: CategoryBreakdown[];
  incomeBreakdown: CategoryBreakdown[];
  netBalanceTrend: NetBalancePoint[];
  totals: {
    totalIncome: number;
    totalExpenses: number;
    totalNetBalance: number;
    totalTransactions: number;
  };
}> {
  // Get all components
  const [summary, expenseBreakdown, incomeBreakdown, netBalanceTrend] = await Promise.all([
    calculateMonthlySummary(userId, startDate, endDate),
    calculateCategoryBreakdown(userId, startDate, endDate, 'EXPENSE'),
    calculateCategoryBreakdown(userId, startDate, endDate, 'INCOME'),
    calculateNetBalanceOverTime(userId, startDate, endDate),
  ]);

  // Calculate totals
  const totals = summary.reduce(
    (acc, month) => ({
      totalIncome: acc.totalIncome + month.income,
      totalExpenses: acc.totalExpenses + month.expenses,
      totalNetBalance: acc.totalNetBalance + month.netBalance,
      totalTransactions: acc.totalTransactions + month.transactionCount,
    }),
    {
      totalIncome: 0,
      totalExpenses: 0,
      totalNetBalance: 0,
      totalTransactions: 0,
    }
  );

  return {
    summary,
    expenseBreakdown,
    incomeBreakdown,
    netBalanceTrend,
    totals,
  };
}
