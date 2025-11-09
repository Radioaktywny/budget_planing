import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import { reportService } from '../services/reportService';
import { Account, Transaction, ReportSummary, CategoryBreakdown } from '../types';
import PieChart from '../components/PieChart';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [currentMonthSummary, setCurrentMonthSummary] = useState<ReportSummary | null>(null);
  const [expenseBreakdown, setExpenseBreakdown] = useState<CategoryBreakdown[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current month date range
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const startDate = startOfMonth.toISOString().split('T')[0];
      const endDate = endOfMonth.toISOString().split('T')[0];

      // Load all data in parallel
      const [accountsData, summaryData, breakdownData, transactionsData] = await Promise.all([
        accountService.getAll(),
        reportService.getSummary(startDate, endDate),
        reportService.getCategoryBreakdown(startDate, endDate, 'EXPENSE'),
        transactionService.getAll({ limit: 10, sortBy: 'date', sortOrder: 'desc' }),
      ]);

      setAccounts(accountsData);
      
      // Calculate total balance across all accounts
      const total = accountsData.reduce((sum, account) => sum + Number(account.balance), 0);
      setTotalBalance(total);

      setCurrentMonthSummary(summaryData);
      setExpenseBreakdown(breakdownData);
      setRecentTransactions(transactionsData.transactions);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'INCOME':
        return 'text-green-600';
      case 'EXPENSE':
        return 'text-red-600';
      case 'TRANSFER':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  // Prepare chart data
  const chartData = expenseBreakdown.map((item) => ({
    name: item.categoryName,
    value: item.amount,
    color: item.color,
  }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={() => navigate('/transactions')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm sm:text-base"
          >
            <span className="sm:hidden">+ Transaction</span>
            <span className="hidden sm:inline">Add Transaction</span>
          </button>
          <button
            onClick={() => navigate('/import')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm sm:text-base"
          >
            <span className="sm:hidden">+ Document</span>
            <span className="hidden sm:inline">Upload Document</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Balance</h3>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBalance)}</p>
          <p className="text-xs text-gray-500 mt-1">Across {accounts.length} accounts</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Current Month Income</h3>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(currentMonthSummary?.totalIncome || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Current Month Expenses</h3>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(currentMonthSummary?.totalExpenses || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Net Balance</h3>
          <p
            className={`text-2xl font-bold ${
              (currentMonthSummary?.netBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {formatCurrency(currentMonthSummary?.netBalance || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">This month</p>
        </div>
      </div>

      {/* Charts and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown Chart */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Expense Breakdown</h2>
          {chartData.length > 0 ? (
            <div className="h-64 sm:h-80">
              <PieChart data={chartData} />
            </div>
          ) : (
            <div className="h-64 sm:h-80 flex items-center justify-center text-gray-500">
              No expenses this month
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">Recent Transactions</h2>
            <button
              onClick={() => navigate('/transactions')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b last:border-b-0 gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{transaction.description}</p>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                      <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
                      {transaction.category && (
                        <>
                          <span className="text-gray-300 hidden sm:inline">•</span>
                          <p className="text-xs text-gray-500 truncate">{transaction.category.name}</p>
                        </>
                      )}
                      {transaction.account && (
                        <>
                          <span className="text-gray-300 hidden sm:inline">•</span>
                          <p className="text-xs text-gray-500 truncate">{transaction.account.name}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <p className={`font-semibold whitespace-nowrap ${getTransactionTypeColor(transaction.type)}`}>
                    {transaction.type === 'INCOME' ? '+' : transaction.type === 'EXPENSE' ? '-' : ''}
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">No transactions yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
