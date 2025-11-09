import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Plus, 
  Upload,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Calendar,
  CreditCard
} from 'lucide-react';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import { reportService } from '../services/reportService';
import { Account, Transaction, ReportSummary, CategoryBreakdown } from '../types';
import PieChart from '../components/PieChart';
import { formatCurrency, formatDate } from '../utils/formatters';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [currentMonthSummary, setCurrentMonthSummary] = useState<ReportSummary | null>(null);
  const [expenseBreakdown, setExpenseBreakdown] = useState<CategoryBreakdown[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Date range state - default to previous month
  const [dateRange, setDateRange] = useState<'previous-month' | 'current-month' | 'last-3-months' | 'custom'>('previous-month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, [dateRange, customStartDate, customEndDate]);

  const getDateRange = (): { startDate: string; endDate: string } => {
    const now = new Date();
    
    switch (dateRange) {
      case 'previous-month': {
        const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          startDate: startOfPrevMonth.toISOString().split('T')[0],
          endDate: endOfPrevMonth.toISOString().split('T')[0],
        };
      }
      case 'current-month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          startDate: startOfMonth.toISOString().split('T')[0],
          endDate: endOfMonth.toISOString().split('T')[0],
        };
      }
      case 'last-3-months': {
        const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
        };
      }
      case 'custom': {
        return {
          startDate: customStartDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
          endDate: customEndDate || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0],
        };
      }
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get date range based on selection
      const { startDate, endDate } = getDateRange();
      console.log(`📅 Loading dashboard data for: ${startDate} to ${endDate} (${dateRange})`);

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

  // Using formatCurrency from utils/formatters.ts (PLN currency)

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-r-lg shadow-sm">
          <div className="flex items-center gap-3">
            <TrendingDown className="h-5 w-5" />
            <p className="font-medium">{error}</p>
          </div>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's your financial overview.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/transactions')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Add Transaction</span>
          </button>
          <button
            onClick={() => navigate('/import')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <Calendar className="h-5 w-5" />
            <span>Period:</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setDateRange('previous-month')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dateRange === 'previous-month'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Previous Month
            </button>
            <button
              onClick={() => setDateRange('current-month')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dateRange === 'current-month'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Current Month
            </button>
            <button
              onClick={() => setDateRange('last-3-months')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dateRange === 'last-3-months'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 3 Months
            </button>
            <button
              onClick={() => setDateRange('custom')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dateRange === 'custom'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custom Range
            </button>
          </div>

          {dateRange === 'custom' && (
            <div className="flex flex-col sm:flex-row items-center gap-3 ml-auto">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 font-medium">From:</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 font-medium">To:</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Balance Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <Wallet className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
              {accounts.length} accounts
            </span>
          </div>
          <h3 className="text-sm font-medium text-blue-100 mb-1">Total Balance</h3>
          <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
        </div>

        {/* Income Card */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <ArrowUpRight className="h-5 w-5 text-green-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Income</h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(currentMonthSummary?.totalIncome || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Expenses Card */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-50 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <ArrowDownRight className="h-5 w-5 text-red-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Expenses</h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(currentMonthSummary?.totalExpenses || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Net Balance Card */}
        <div className={`p-6 rounded-xl shadow-md border hover:shadow-lg transition-shadow ${
          (currentMonthSummary?.netBalance || 0) >= 0 
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100' 
            : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-100'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${
              (currentMonthSummary?.netBalance || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <DollarSign className={`h-6 w-6 ${
                (currentMonthSummary?.netBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`} />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Net Balance</h3>
          <p className={`text-2xl font-bold ${
            (currentMonthSummary?.netBalance || 0) >= 0 ? 'text-green-700' : 'text-red-700'
          }`}>
            {formatCurrency(currentMonthSummary?.netBalance || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-2">This month</p>
        </div>
      </div>

      {/* Charts and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expense Breakdown Chart */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Expense Breakdown</h2>
          {chartData.length > 0 ? (
            <div className="h-96">
              <PieChart data={chartData} />
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center text-gray-400">
              <TrendingDown className="h-12 w-12 mb-3 opacity-50" />
              <p className="font-medium">No expenses this month</p>
            </div>
          )}
        </div>

        {/* Recent Transactions Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
            <button
              onClick={() => navigate('/transactions')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View All
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
          
          {recentTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Account
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            transaction.type === 'INCOME' 
                              ? 'bg-green-50' 
                              : transaction.type === 'EXPENSE' 
                              ? 'bg-red-50' 
                              : 'bg-blue-50'
                          }`}>
                            {transaction.type === 'INCOME' ? (
                              <ArrowUpRight className={`h-4 w-4 ${getTransactionTypeColor(transaction.type)}`} />
                            ) : transaction.type === 'EXPENSE' ? (
                              <ArrowDownRight className={`h-4 w-4 ${getTransactionTypeColor(transaction.type)}`} />
                            ) : (
                              <ArrowLeftRight className={`h-4 w-4 ${getTransactionTypeColor(transaction.type)}`} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{transaction.description}</p>
                            <div className="flex items-center gap-2 mt-1 md:hidden">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(transaction.date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                        {transaction.category ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {transaction.category.name}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Uncategorized</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        {transaction.account && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CreditCard className="h-4 w-4 text-gray-400" />
                            {transaction.account.name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`font-semibold text-sm ${getTransactionTypeColor(transaction.type)}`}>
                          {transaction.type === 'INCOME' ? '+' : transaction.type === 'EXPENSE' ? '-' : ''}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <DollarSign className="h-12 w-12 opacity-50" />
                <p className="font-medium">No transactions yet</p>
                <button
                  onClick={() => navigate('/transactions')}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Add your first transaction
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
