import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ReportsPage from '../ReportsPage';
import { reportService } from '../../services/reportService';

// Mock the report service
jest.mock('../../services/reportService');

const mockReportService = reportService as jest.Mocked<typeof reportService>;

describe('ReportsPage', () => {
  const mockReport = {
    summary: [
      {
        month: '2024-01',
        income: 5000,
        expenses: 3000,
        netBalance: 2000,
        transactionCount: 10,
      },
    ],
    expenseBreakdown: [
      {
        categoryId: '1',
        categoryName: 'Food',
        amount: 1500,
        percentage: 50,
        color: '#3b82f6',
      },
    ],
    incomeBreakdown: [],
    netBalanceTrend: [
      {
        date: '2024-01-01',
        balance: 2000,
        income: 5000,
        expenses: 3000,
      },
    ],
    totals: {
      totalIncome: 5000,
      totalExpenses: 3000,
      totalNetBalance: 2000,
      totalTransactions: 10,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockReportService.getComprehensive.mockResolvedValue(mockReport);
  });

  it('renders the reports page', async () => {
    render(
      <BrowserRouter>
        <ReportsPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
  });

  it('displays summary cards with totals', async () => {
    render(
      <BrowserRouter>
        <ReportsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Total Income')).toBeInTheDocument();
      expect(screen.getByText('Total Expenses')).toBeInTheDocument();
      expect(screen.getByText('Net Balance')).toBeInTheDocument();
    });
  });

  it('displays export buttons', () => {
    render(
      <BrowserRouter>
        <ReportsPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Export PDF')).toBeInTheDocument();
    expect(screen.getByText('Export Excel')).toBeInTheDocument();
  });

  it('displays date range selector', () => {
    render(
      <BrowserRouter>
        <ReportsPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Date Range')).toBeInTheDocument();
    expect(screen.getByText('This Month')).toBeInTheDocument();
    expect(screen.getByText('Last Month')).toBeInTheDocument();
  });
});
