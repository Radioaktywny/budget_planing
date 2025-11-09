import ExcelJS from 'exceljs';
import { MonthlySummary, CategoryBreakdown, NetBalancePoint } from './reportService';

export interface ExcelReportData {
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
  dateRange: {
    startDate: string;
    endDate: string;
  };
  transactions?: Array<{
    date: string;
    description: string;
    category: string;
    amount: number;
    type: string;
    account: string;
  }>;
}

/**
 * Generate Excel report with multiple sheets
 * Includes Summary, Transactions, and Category Breakdown sheets
 */
export async function generateExcelReport(data: ExcelReportData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  // Set workbook properties
  workbook.creator = 'Home Budget Manager';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Create sheets
  createSummarySheet(workbook, data);
  createCategoryBreakdownSheet(workbook, data);
  
  if (data.transactions && data.transactions.length > 0) {
    createTransactionsSheet(workbook, data);
  }

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Create Summary sheet with totals and monthly breakdown
 */
function createSummarySheet(workbook: ExcelJS.Workbook, data: ExcelReportData): void {
  const sheet = workbook.addWorksheet('Summary', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });

  // Set column widths
  sheet.columns = [
    { width: 20 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
  ];

  // Title
  sheet.mergeCells('A1:E1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'Budget Report';
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  titleCell.font = { ...titleCell.font, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).height = 30;

  // Date range
  sheet.mergeCells('A2:E2');
  const dateCell = sheet.getCell('A2');
  dateCell.value = `Period: ${data.dateRange.startDate} to ${data.dateRange.endDate}`;
  dateCell.font = { size: 12, italic: true };
  dateCell.alignment = { horizontal: 'center' };
  sheet.getRow(2).height = 20;

  // Empty row
  sheet.addRow([]);

  // Overall Totals section
  sheet.mergeCells('A4:E4');
  const totalsHeaderCell = sheet.getCell('A4');
  totalsHeaderCell.value = 'Overall Totals';
  totalsHeaderCell.font = { size: 14, bold: true };
  totalsHeaderCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE7E6E6' },
  };

  // Total Income
  const incomeRow = sheet.addRow(['Total Income', '', '', '', data.totals.totalIncome]);
  incomeRow.getCell(5).numFmt = '$#,##0.00';
  incomeRow.getCell(5).font = { bold: true, color: { argb: 'FF00B050' } };

  // Total Expenses
  const expenseRow = sheet.addRow(['Total Expenses', '', '', '', data.totals.totalExpenses]);
  expenseRow.getCell(5).numFmt = '$#,##0.00';
  expenseRow.getCell(5).font = { bold: true, color: { argb: 'FFFF0000' } };

  // Net Balance
  const netRow = sheet.addRow(['Net Balance', '', '', '', data.totals.totalNetBalance]);
  netRow.getCell(5).numFmt = '$#,##0.00';
  netRow.getCell(5).font = { bold: true };
  netRow.getCell(5).font = {
    ...netRow.getCell(5).font,
    color: { argb: data.totals.totalNetBalance >= 0 ? 'FF00B050' : 'FFFF0000' },
  };

  // Total Transactions
  sheet.addRow(['Total Transactions', '', '', '', data.totals.totalTransactions]);

  // Empty row
  sheet.addRow([]);

  // Monthly Breakdown section
  sheet.mergeCells(`A${sheet.rowCount + 1}:E${sheet.rowCount + 1}`);
  const monthlyHeaderCell = sheet.getCell(`A${sheet.rowCount}`);
  monthlyHeaderCell.value = 'Monthly Breakdown';
  monthlyHeaderCell.font = { size: 14, bold: true };
  monthlyHeaderCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE7E6E6' },
  };

  // Monthly table headers
  const headerRow = sheet.addRow(['Month', 'Income', 'Expenses', 'Net Balance', 'Transactions']);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9D9D9' },
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

  // Monthly data
  data.summary.forEach((month) => {
    const row = sheet.addRow([
      month.month,
      month.income,
      month.expenses,
      month.netBalance,
      month.transactionCount,
    ]);

    // Format currency columns
    row.getCell(2).numFmt = '$#,##0.00';
    row.getCell(3).numFmt = '$#,##0.00';
    row.getCell(4).numFmt = '$#,##0.00';

    // Color code net balance
    row.getCell(4).font = {
      color: { argb: month.netBalance >= 0 ? 'FF00B050' : 'FFFF0000' },
    };
  });

  // Add borders to all cells with data
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 4) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    }
  });
}

/**
 * Create Category Breakdown sheet
 */
function createCategoryBreakdownSheet(workbook: ExcelJS.Workbook, data: ExcelReportData): void {
  const sheet = workbook.addWorksheet('Category Breakdown', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });

  // Set column widths
  sheet.columns = [
    { width: 25 },
    { width: 20 },
    { width: 15 },
    { width: 12 },
    { width: 15 },
  ];

  // Title
  sheet.mergeCells('A1:E1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'Category Breakdown';
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  titleCell.font = { ...titleCell.font, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).height = 30;

  // Empty row
  sheet.addRow([]);

  // Expense Breakdown section
  sheet.mergeCells('A3:E3');
  const expenseHeaderCell = sheet.getCell('A3');
  expenseHeaderCell.value = 'Expense Breakdown';
  expenseHeaderCell.font = { size: 14, bold: true };
  expenseHeaderCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFE699' },
  };

  // Expense table headers
  const expenseHeaderRow = sheet.addRow([
    'Category',
    'Parent Category',
    'Amount',
    'Percentage',
    'Transactions',
  ]);
  expenseHeaderRow.font = { bold: true };
  expenseHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9D9D9' },
  };
  expenseHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };

  // Expense data
  data.expenseBreakdown.forEach((category) => {
    const row = sheet.addRow([
      category.categoryName,
      category.parentCategoryName || '',
      category.amount,
      category.percentage / 100,
      category.transactionCount,
    ]);

    row.getCell(3).numFmt = '$#,##0.00';
    row.getCell(4).numFmt = '0.00%';
  });

  // Empty rows
  sheet.addRow([]);
  sheet.addRow([]);

  // Income Breakdown section
  const incomeStartRow = sheet.rowCount + 1;
  sheet.mergeCells(`A${incomeStartRow}:E${incomeStartRow}`);
  const incomeHeaderCell = sheet.getCell(`A${incomeStartRow}`);
  incomeHeaderCell.value = 'Income Breakdown';
  incomeHeaderCell.font = { size: 14, bold: true };
  incomeHeaderCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFC6EFCE' },
  };

  // Income table headers
  const incomeHeaderRow = sheet.addRow([
    'Category',
    'Parent Category',
    'Amount',
    'Percentage',
    'Transactions',
  ]);
  incomeHeaderRow.font = { bold: true };
  incomeHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9D9D9' },
  };
  incomeHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };

  // Income data
  data.incomeBreakdown.forEach((category) => {
    const row = sheet.addRow([
      category.categoryName,
      category.parentCategoryName || '',
      category.amount,
      category.percentage / 100,
      category.transactionCount,
    ]);

    row.getCell(3).numFmt = '$#,##0.00';
    row.getCell(4).numFmt = '0.00%';
  });

  // Add borders to all cells with data
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 3) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    }
  });
}

/**
 * Create Transactions sheet with all transaction data
 */
function createTransactionsSheet(workbook: ExcelJS.Workbook, data: ExcelReportData): void {
  const sheet = workbook.addWorksheet('Transactions', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });

  // Set column widths
  sheet.columns = [
    { width: 12 },
    { width: 35 },
    { width: 20 },
    { width: 15 },
    { width: 12 },
    { width: 20 },
  ];

  // Title
  sheet.mergeCells('A1:F1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'All Transactions';
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  titleCell.font = { ...titleCell.font, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).height = 30;

  // Table headers
  const headerRow = sheet.addRow(['Date', 'Description', 'Category', 'Amount', 'Type', 'Account']);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9D9D9' },
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

  // Transaction data
  if (data.transactions) {
    data.transactions.forEach((transaction) => {
      const row = sheet.addRow([
        transaction.date,
        transaction.description,
        transaction.category,
        transaction.amount,
        transaction.type,
        transaction.account,
      ]);

      // Format amount column
      row.getCell(4).numFmt = '$#,##0.00';

      // Color code by type
      if (transaction.type === 'INCOME') {
        row.getCell(4).font = { color: { argb: 'FF00B050' } };
      } else if (transaction.type === 'EXPENSE') {
        row.getCell(4).font = { color: { argb: 'FFFF0000' } };
      }
    });
  }

  // Add borders to all cells with data
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 1) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    }
  });

  // Add autofilter to headers
  sheet.autoFilter = {
    from: 'A2',
    to: 'F2',
  };
}
