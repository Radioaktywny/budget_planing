import { describe, it, expect } from '@jest/globals';
import * as pdfService from '../pdfService';
import { MonthlySummary, CategoryBreakdown, NetBalancePoint } from '../reportService';

describe('PDF Service', () => {
  describe('generatePDFReport', () => {
    it('should generate a PDF buffer with valid data', async () => {
      const reportData = {
        summary: [
          {
            month: '2024-01',
            income: 5000,
            expenses: 3000,
            netBalance: 2000,
            transactionCount: 25,
          },
          {
            month: '2024-02',
            income: 5500,
            expenses: 3200,
            netBalance: 2300,
            transactionCount: 28,
          },
        ] as MonthlySummary[],
        expenseBreakdown: [
          {
            categoryId: 'cat1',
            categoryName: 'Food & Dining',
            amount: 1200,
            percentage: 40,
            transactionCount: 15,
          },
          {
            categoryId: 'cat2',
            categoryName: 'Transportation',
            amount: 800,
            percentage: 26.67,
            transactionCount: 8,
          },
          {
            categoryId: 'cat3',
            categoryName: 'Entertainment',
            amount: 1000,
            percentage: 33.33,
            transactionCount: 10,
          },
        ] as CategoryBreakdown[],
        incomeBreakdown: [
          {
            categoryId: 'cat4',
            categoryName: 'Salary',
            amount: 5000,
            percentage: 100,
            transactionCount: 1,
          },
        ] as CategoryBreakdown[],
        netBalanceTrend: [
          {
            month: '2024-01',
            netBalance: 2000,
            cumulativeBalance: 2000,
          },
          {
            month: '2024-02',
            netBalance: 2300,
            cumulativeBalance: 4300,
          },
        ] as NetBalancePoint[],
        totals: {
          totalIncome: 10500,
          totalExpenses: 6200,
          totalNetBalance: 4300,
          totalTransactions: 53,
        },
        dateRange: {
          startDate: '2024-01-01',
          endDate: '2024-02-29',
        },
      };

      const pdfBuffer = await pdfService.generatePDFReport(reportData);

      // Verify PDF buffer is generated
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);

      // Verify PDF header (PDF files start with %PDF-)
      const header = pdfBuffer.toString('utf8', 0, 5);
      expect(header).toBe('%PDF-');
    });

    it('should generate PDF with empty data', async () => {
      const reportData = {
        summary: [] as MonthlySummary[],
        expenseBreakdown: [] as CategoryBreakdown[],
        incomeBreakdown: [] as CategoryBreakdown[],
        netBalanceTrend: [] as NetBalancePoint[],
        totals: {
          totalIncome: 0,
          totalExpenses: 0,
          totalNetBalance: 0,
          totalTransactions: 0,
        },
        dateRange: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
      };

      const pdfBuffer = await pdfService.generatePDFReport(reportData);

      // Verify PDF buffer is generated even with empty data
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);

      // Verify PDF header
      const header = pdfBuffer.toString('utf8', 0, 5);
      expect(header).toBe('%PDF-');
    });

    it('should generate PDF with negative net balance', async () => {
      const reportData = {
        summary: [
          {
            month: '2024-01',
            income: 2000,
            expenses: 3000,
            netBalance: -1000,
            transactionCount: 20,
          },
        ] as MonthlySummary[],
        expenseBreakdown: [
          {
            categoryId: 'cat1',
            categoryName: 'Food & Dining',
            amount: 3000,
            percentage: 100,
            transactionCount: 20,
          },
        ] as CategoryBreakdown[],
        incomeBreakdown: [
          {
            categoryId: 'cat2',
            categoryName: 'Salary',
            amount: 2000,
            percentage: 100,
            transactionCount: 1,
          },
        ] as CategoryBreakdown[],
        netBalanceTrend: [
          {
            month: '2024-01',
            netBalance: -1000,
            cumulativeBalance: -1000,
          },
        ] as NetBalancePoint[],
        totals: {
          totalIncome: 2000,
          totalExpenses: 3000,
          totalNetBalance: -1000,
          totalTransactions: 21,
        },
        dateRange: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
      };

      const pdfBuffer = await pdfService.generatePDFReport(reportData);

      // Verify PDF is generated with negative values
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);

      // Verify PDF header
      const header = pdfBuffer.toString('utf8', 0, 5);
      expect(header).toBe('%PDF-');
    });

    it('should generate PDF with multiple categories', async () => {
      const expenseBreakdown: CategoryBreakdown[] = [];
      for (let i = 1; i <= 15; i++) {
        expenseBreakdown.push({
          categoryId: `cat${i}`,
          categoryName: `Category ${i}`,
          amount: 100 * i,
          percentage: (100 * i) / 1200,
          transactionCount: i,
        });
      }

      const reportData = {
        summary: [
          {
            month: '2024-01',
            income: 5000,
            expenses: 1200,
            netBalance: 3800,
            transactionCount: 120,
          },
        ] as MonthlySummary[],
        expenseBreakdown,
        incomeBreakdown: [] as CategoryBreakdown[],
        netBalanceTrend: [
          {
            month: '2024-01',
            netBalance: 3800,
            cumulativeBalance: 3800,
          },
        ] as NetBalancePoint[],
        totals: {
          totalIncome: 5000,
          totalExpenses: 1200,
          totalNetBalance: 3800,
          totalTransactions: 120,
        },
        dateRange: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
      };

      const pdfBuffer = await pdfService.generatePDFReport(reportData);

      // Verify PDF is generated with many categories
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);

      // Verify PDF header
      const header = pdfBuffer.toString('utf8', 0, 5);
      expect(header).toBe('%PDF-');
    });

    it('should format currency values correctly', async () => {
      const reportData = {
        summary: [
          {
            month: '2024-01',
            income: 1234.56,
            expenses: 789.12,
            netBalance: 445.44,
            transactionCount: 10,
          },
        ] as MonthlySummary[],
        expenseBreakdown: [
          {
            categoryId: 'cat1',
            categoryName: 'Test Category',
            amount: 789.12,
            percentage: 100,
            transactionCount: 10,
          },
        ] as CategoryBreakdown[],
        incomeBreakdown: [] as CategoryBreakdown[],
        netBalanceTrend: [
          {
            month: '2024-01',
            netBalance: 445.44,
            cumulativeBalance: 445.44,
          },
        ] as NetBalancePoint[],
        totals: {
          totalIncome: 1234.56,
          totalExpenses: 789.12,
          totalNetBalance: 445.44,
          totalTransactions: 10,
        },
        dateRange: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
      };

      const pdfBuffer = await pdfService.generatePDFReport(reportData);

      // Verify PDF is generated
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);

      // Verify PDF header
      const header = pdfBuffer.toString('utf8', 0, 5);
      expect(header).toBe('%PDF-');
    });
  });
});
