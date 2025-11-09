import { Request, Response } from 'express';
import * as reportService from '../services/reportService';
import * as pdfService from '../services/pdfService';
import * as excelService from '../services/excelService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/reports/summary
 * Get monthly summary for a date range
 * Query params: userId, startDate, endDate
 */
export async function getMonthlySummary(req: Request, res: Response): Promise<void> {
  try {
    const { userId, startDate, endDate } = req.query;

    // Validate required parameters
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'userId is required',
        },
      });
      return;
    }

    if (!startDate || typeof startDate !== 'string') {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'startDate is required',
        },
      });
      return;
    }

    if (!endDate || typeof endDate !== 'string') {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'endDate is required',
        },
      });
      return;
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid date format',
        },
      });
      return;
    }

    if (start > end) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'startDate must be before endDate',
        },
      });
      return;
    }

    // Get monthly summary
    const monthlySummaries = await reportService.calculateMonthlySummary(userId, start, end);

    // Aggregate monthly summaries into a single summary
    const summary = {
      totalIncome: monthlySummaries.reduce((sum, m) => sum + m.income, 0),
      totalExpenses: monthlySummaries.reduce((sum, m) => sum + m.expenses, 0),
      netBalance: monthlySummaries.reduce((sum, m) => sum + m.netBalance, 0),
      startDate: startDate,
      endDate: endDate,
    };

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Error getting monthly summary:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get monthly summary',
      },
    });
  }
}

/**
 * GET /api/reports/category-breakdown
 * Get category breakdown for a date range
 * Query params: userId, startDate, endDate, type (optional, defaults to EXPENSE)
 */
export async function getCategoryBreakdown(req: Request, res: Response): Promise<void> {
  try {
    const { userId, startDate, endDate, type } = req.query;

    // Validate required parameters
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'userId is required',
        },
      });
      return;
    }

    if (!startDate || typeof startDate !== 'string') {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'startDate is required',
        },
      });
      return;
    }

    if (!endDate || typeof endDate !== 'string') {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'endDate is required',
        },
      });
      return;
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid date format',
        },
      });
      return;
    }

    if (start > end) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'startDate must be before endDate',
        },
      });
      return;
    }

    // Validate type
    const transactionType = (type as string) || 'EXPENSE';
    if (transactionType !== 'INCOME' && transactionType !== 'EXPENSE') {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'type must be either INCOME or EXPENSE',
        },
      });
      return;
    }

    // Get category breakdown
    const breakdown = await reportService.calculateCategoryBreakdown(
      userId,
      start,
      end,
      transactionType as 'INCOME' | 'EXPENSE'
    );

    res.json({
      success: true,
      data: breakdown,
    });
  } catch (error) {
    console.error('Error getting category breakdown:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get category breakdown',
      },
    });
  }
}

/**
 * GET /api/reports/net-balance
 * Get net balance over time for a date range
 * Query params: userId, startDate, endDate
 */
export async function getNetBalanceOverTime(req: Request, res: Response): Promise<void> {
  try {
    const { userId, startDate, endDate } = req.query;

    // Validate required parameters
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'userId is required',
        },
      });
      return;
    }

    if (!startDate || typeof startDate !== 'string') {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'startDate is required',
        },
      });
      return;
    }

    if (!endDate || typeof endDate !== 'string') {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'endDate is required',
        },
      });
      return;
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid date format',
        },
      });
      return;
    }

    if (start > end) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'startDate must be before endDate',
        },
      });
      return;
    }

    // Get net balance over time
    const netBalance = await reportService.calculateNetBalanceOverTime(userId, start, end);

    res.json({
      success: true,
      data: netBalance,
    });
  } catch (error) {
    console.error('Error getting net balance over time:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get net balance over time',
      },
    });
  }
}

/**
 * GET /api/reports/comprehensive
 * Get comprehensive report with all data for a date range
 * Query params: userId, startDate, endDate
 */
export async function getComprehensiveReport(req: Request, res: Response): Promise<void> {
  try {
    const { userId, startDate, endDate } = req.query;

    // Validate required parameters
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'userId is required',
        },
      });
      return;
    }

    if (!startDate || typeof startDate !== 'string') {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'startDate is required',
        },
      });
      return;
    }

    if (!endDate || typeof endDate !== 'string') {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'endDate is required',
        },
      });
      return;
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid date format',
        },
      });
      return;
    }

    if (start > end) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'startDate must be before endDate',
        },
      });
      return;
    }

    // Get comprehensive report
    const report = await reportService.getComprehensiveReport(userId, start, end);

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error getting comprehensive report:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get comprehensive report',
      },
    });
  }
}

/**
 * POST /api/reports/export/pdf
 * Generate and download PDF report for a date range
 * Body: { userId, startDate, endDate }
 */
export async function exportPDFReport(req: Request, res: Response): Promise<void> {
  try {
    const { userId, startDate, endDate } = req.body;

    // Validate required parameters
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'userId is required',
        },
      });
      return;
    }

    if (!startDate || typeof startDate !== 'string') {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'startDate is required',
        },
      });
      return;
    }

    if (!endDate || typeof endDate !== 'string') {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'endDate is required',
        },
      });
      return;
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid date format',
        },
      });
      return;
    }

    if (start > end) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'startDate must be before endDate',
        },
      });
      return;
    }

    // Get comprehensive report data
    const reportData = await reportService.getComprehensiveReport(userId, start, end);

    // Generate PDF
    const pdfBuffer = await pdfService.generatePDFReport({
      ...reportData,
      dateRange: {
        startDate,
        endDate,
      },
    });

    // Set response headers for file download
    const filename = `budget-report-${startDate}-to-${endDate}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF buffer
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error exporting PDF report:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to export PDF report',
      },
    });
  }
}

/**
 * POST /api/reports/export/excel
 * Generate and download Excel report for a date range
 * Body: { userId, startDate, endDate, includeTransactions }
 */
export async function exportExcelReport(req: Request, res: Response): Promise<void> {
  try {
    const { userId, startDate, endDate, includeTransactions } = req.body;

    // Validate required parameters
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'userId is required',
        },
      });
      return;
    }

    if (!startDate || typeof startDate !== 'string') {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'startDate is required',
        },
      });
      return;
    }

    if (!endDate || typeof endDate !== 'string') {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'endDate is required',
        },
      });
      return;
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid date format',
        },
      });
      return;
    }

    if (start > end) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'startDate must be before endDate',
        },
      });
      return;
    }

    // Get comprehensive report data
    const reportData = await reportService.getComprehensiveReport(userId, start, end);

    // Optionally include all transactions
    let transactions: Array<{
      date: string;
      description: string;
      category: string;
      amount: number;
      type: string;
      account: string;
    }> | undefined;

    if (includeTransactions === true) {
      const transactionRecords = await prisma.transaction.findMany({
        where: {
          userId,
          date: {
            gte: start,
            lte: end,
          },
          isParent: false,
        },
        include: {
          category: true,
          account: true,
        },
        orderBy: {
          date: 'desc',
        },
      });

      transactions = transactionRecords.map((t) => ({
        date: t.date.toISOString().split('T')[0],
        description: t.description,
        category: t.category?.name || 'Uncategorized',
        amount: Number(t.amount),
        type: t.type,
        account: t.account.name,
      }));
    }

    // Generate Excel
    const excelBuffer = await excelService.generateExcelReport({
      ...reportData,
      dateRange: {
        startDate,
        endDate,
      },
      transactions,
    });

    // Set response headers for file download
    const filename = `budget-report-${startDate}-to-${endDate}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    // Send Excel buffer
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting Excel report:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to export Excel report',
      },
    });
  }
}
