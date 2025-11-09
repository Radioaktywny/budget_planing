import { describe, it, expect } from '@jest/globals';
import * as excelService from '../excelService';
import ExcelJS from 'exceljs';

describe('Excel Service', () => {
  const mockReportData: excelService.ExcelReportData = {
    summary: [
      {
        month: '2024-01',
        income: 5000,
        expenses: 3000,
        netBalance: 2000,
        transactionCount: 15,
      },
      {
        month: '2024-02',
        income: 5500,
        expenses: 3200,
        netBalance: 2300,
        transactionCount: 18,
      },
    ],
    expenseBreakdown: [
      {
        categoryId: 'cat1',
        categoryName: 'Food & Dining',
        amount: 1200,
        percentage: 40,
        transactionCount: 8,
      },
      {
        categoryId: 'cat2',
        categoryName: 'Transportation',
        amount: 800,
        percentage: 26.67,
        transactionCount: 5,
        parentCategoryId: 'parent1',
        parentCategoryName: 'Travel',
      },
    ],
    incomeBreakdown: [
      {
        categoryId: 'cat3',
        categoryName: 'Salary',
        amount: 5000,
        percentage: 100,
        transactionCount: 2,
      },
    ],
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
    ],
    totals: {
      totalIncome: 10500,
      totalExpenses: 6200,
      totalNetBalance: 4300,
      totalTransactions: 33,
    },
    dateRange: {
      startDate: '2024-01-01',
      endDate: '2024-02-29',
    },
  };

  describe('generateExcelReport', () => {
    it('should generate Excel buffer', async () => {
      const buffer = await excelService.generateExcelReport(mockReportData);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should create Summary sheet with correct data', async () => {
      const buffer = await excelService.generateExcelReport(mockReportData);

      // Parse the generated Excel file
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const summarySheet = workbook.getWorksheet('Summary');
      expect(summarySheet).toBeDefined();

      // Check title
      const titleCell = summarySheet?.getCell('A1');
      expect(titleCell?.value).toBe('Budget Report');

      // Check date range
      const dateCell = summarySheet?.getCell('A2');
      expect(dateCell?.value).toContain('2024-01-01');
      expect(dateCell?.value).toContain('2024-02-29');

      // Check totals section exists
      const totalsHeader = summarySheet?.getCell('A4');
      expect(totalsHeader?.value).toBe('Overall Totals');

      // Check total income value
      const totalIncomeCell = summarySheet?.getCell('E5');
      expect(Number(totalIncomeCell?.value)).toBe(10500);

      // Check total expenses value
      const totalExpensesCell = summarySheet?.getCell('E6');
      expect(Number(totalExpensesCell?.value)).toBe(6200);

      // Check net balance value
      const netBalanceCell = summarySheet?.getCell('E7');
      expect(Number(netBalanceCell?.value)).toBe(4300);
    });

    it('should create Category Breakdown sheet with expense and income data', async () => {
      const buffer = await excelService.generateExcelReport(mockReportData);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const categorySheet = workbook.getWorksheet('Category Breakdown');
      expect(categorySheet).toBeDefined();

      // Check title
      const titleCell = categorySheet?.getCell('A1');
      expect(titleCell?.value).toBe('Category Breakdown');

      // Check expense breakdown section
      const expenseHeader = categorySheet?.getCell('A3');
      expect(expenseHeader?.value).toBe('Expense Breakdown');

      // Check expense data - first category
      const firstCategoryCell = categorySheet?.getCell('A5');
      expect(firstCategoryCell?.value).toBe('Food & Dining');

      const firstAmountCell = categorySheet?.getCell('C5');
      expect(Number(firstAmountCell?.value)).toBe(1200);

      // Check income breakdown section exists
      let incomeHeaderFound = false;
      categorySheet?.eachRow((row) => {
        row.eachCell((cell) => {
          if (cell.value === 'Income Breakdown') {
            incomeHeaderFound = true;
          }
        });
      });
      expect(incomeHeaderFound).toBe(true);
    });

    it('should create Transactions sheet when transactions are provided', async () => {
      const dataWithTransactions = {
        ...mockReportData,
        transactions: [
          {
            date: '2024-01-15',
            description: 'Grocery Store',
            category: 'Food & Dining',
            amount: 150.5,
            type: 'EXPENSE',
            account: 'Checking',
          },
          {
            date: '2024-01-01',
            description: 'Salary',
            category: 'Salary',
            amount: 5000,
            type: 'INCOME',
            account: 'Checking',
          },
        ],
      };

      const buffer = await excelService.generateExcelReport(dataWithTransactions);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const transactionsSheet = workbook.getWorksheet('Transactions');
      expect(transactionsSheet).toBeDefined();

      // Check title
      const titleCell = transactionsSheet?.getCell('A1');
      expect(titleCell?.value).toBe('All Transactions');

      // Check headers
      const dateHeader = transactionsSheet?.getCell('A2');
      expect(dateHeader?.value).toBe('Date');

      const descHeader = transactionsSheet?.getCell('B2');
      expect(descHeader?.value).toBe('Description');

      // Check first transaction data
      const firstDateCell = transactionsSheet?.getCell('A3');
      expect(firstDateCell?.value).toBe('2024-01-15');

      const firstDescCell = transactionsSheet?.getCell('B3');
      expect(firstDescCell?.value).toBe('Grocery Store');

      const firstAmountCell = transactionsSheet?.getCell('D3');
      expect(Number(firstAmountCell?.value)).toBe(150.5);
    });

    it('should not create Transactions sheet when transactions are not provided', async () => {
      const buffer = await excelService.generateExcelReport(mockReportData);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const transactionsSheet = workbook.getWorksheet('Transactions');
      expect(transactionsSheet).toBeUndefined();
    });

    it('should format currency cells correctly', async () => {
      const buffer = await excelService.generateExcelReport(mockReportData);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const summarySheet = workbook.getWorksheet('Summary');

      // Check currency format on total income cell
      const totalIncomeCell = summarySheet?.getCell('E5');
      expect(totalIncomeCell?.numFmt).toBe('$#,##0.00');

      // Check currency format on monthly data - find the first data row after headers
      let monthlyDataRowFound = false;
      summarySheet?.eachRow((row, rowNumber) => {
        if (rowNumber > 10) {
          // After the monthly breakdown header
          const incomeCell = row.getCell(2);
          if (incomeCell.value && typeof incomeCell.value === 'number') {
            expect(incomeCell.numFmt).toBe('$#,##0.00');
            monthlyDataRowFound = true;
          }
        }
      });
      expect(monthlyDataRowFound).toBe(true);
    });

    it('should apply proper styling to headers', async () => {
      const buffer = await excelService.generateExcelReport(mockReportData);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const summarySheet = workbook.getWorksheet('Summary');

      // Check title styling
      const titleCell = summarySheet?.getCell('A1');
      expect(titleCell?.font?.bold).toBe(true);
      expect(titleCell?.font?.size).toBe(16);
      expect(titleCell?.alignment?.horizontal).toBe('center');
    });

    it('should handle empty data gracefully', async () => {
      const emptyData: excelService.ExcelReportData = {
        summary: [],
        expenseBreakdown: [],
        incomeBreakdown: [],
        netBalanceTrend: [],
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

      const buffer = await excelService.generateExcelReport(emptyData);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const summarySheet = workbook.getWorksheet('Summary');
      expect(summarySheet).toBeDefined();
    });
  });
});
