import React, { useState, useEffect, useCallback } from 'react';
import { reportService } from '../services/reportService';
import { ComprehensiveReport } from '../types';
import PieChart from '../components/PieChart';
import BarChart from '../components/BarChart';
import LineChart from '../components/LineChart';
import { formatCurrency } from '../utils/formatters';

const ReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ComprehensiveReport | null>(null);
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);

  // Date range state - default to current month
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  });

  // Load report data
  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportService.getComprehensive(startDate, endDate);
      setReport(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load report');
      console.error('Error loading report:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // Load report on mount and when dates change
  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // Handle PDF export
  const handleExportPDF = async () => {
    try {
      setExporting('pdf');
      await reportService.exportPDF(startDate, endDate);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to export PDF');
      console.error('Error exporting PDF:', err);
    } finally {
      setExporting(null);
    }
  };

  // Handle Excel export
  const handleExportExcel = async () => {
    try {
      setExporting('excel');
      await reportService.exportExcel(startDate, endDate);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to export Excel');
      console.error('Error exporting Excel:', err);
    } finally {
      setExporting(null);
    }
  };

  // Set date range presets
  const setDateRange = (preset: string) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case 'this-month':
        start.setDate(1);
        break;
      case 'last-month':
        start.setMonth(today.getMonth() - 1);
        start.setDate(1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'last-3-months':
        start.setMonth(today.getMonth() - 3);
        start.setDate(1);
        break;
      case 'last-6-months':
        start.setMonth(today.getMonth() - 6);
        start.setDate(1);
        break;
      case 'this-year':
        start = new Date(today.getFullYear(), 0, 1);
        break;
      case 'last-year':
        start = new Date(today.getFullYear() - 1, 0, 1);
        end = new Date(today.getFullYear() - 1, 11, 31);
        break;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // Prepare chart data - show only top 8 categories, group rest as "Other"
  const expenseChartData = (() => {
    if (!report?.expenseBreakdown || report.expenseBreakdown.length === 0) return [];
    
    // Sort by amount descending
    const sorted = [...report.expenseBreakdown].sort((a, b) => b.amount - a.amount);
    
    // Take top 8 categories
    const top8 = sorted.slice(0, 8).map(item => ({
      name: item.categoryName,
      value: item.amount,
      color: item.color,
    }));
    
    // Group remaining as "Other"
    if (sorted.length > 8) {
      const otherAmount = sorted.slice(8).reduce((sum, item) => sum + item.amount, 0);
      if (otherAmount > 0) {
        top8.push({
          name: 'Other',
          value: otherAmount,
          color: '#9CA3AF', // gray-400
        });
      }
    }
    
    return top8;
  })();

  const monthComparisonData = report?.summary.map(item => ({
    name: item.month,
    income: item.income,
    expenses: item.expenses,
  })) || [];

  const netBalanceData = report?.netBalanceTrend.map(item => ({
    name: item.date,
    value: item.balance,
  })) || [];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Reports & Analytics</h1>
        
        {/* Export buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleExportPDF}
            disabled={loading || exporting !== null || !report}
            className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {exporting === 'pdf' ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Export PDF</span>
                <span className="sm:hidden">PDF</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleExportExcel}
            disabled={loading || exporting !== null || !report}
            className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {exporting === 'excel' ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Export Excel</span>
                <span className="sm:hidden">Excel</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Date range selector */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
        <h2 className="text-base sm:text-lg font-semibold mb-4">Date Range</h2>
        
        {/* Quick presets */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setDateRange('this-month')}
            className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            This Month
          </button>
          <button
            onClick={() => setDateRange('last-month')}
            className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            Last Month
          </button>
          <button
            onClick={() => setDateRange('last-3-months')}
            className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            Last 3 Months
          </button>
          <button
            onClick={() => setDateRange('last-6-months')}
            className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            Last 6 Months
          </button>
          <button
            onClick={() => setDateRange('this-year')}
            className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            This Year
          </button>
          <button
            onClick={() => setDateRange('last-year')}
            className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            Last Year
          </button>
        </div>

        {/* Custom date inputs */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Report content */}
      {!loading && report && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Income</h3>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">
                {formatCurrency(report.totals.totalIncome)}
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Expenses</h3>
              <p className="text-2xl sm:text-3xl font-bold text-red-600">
                {formatCurrency(report.totals.totalExpenses)}
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 sm:p-6 sm:col-span-2 md:col-span-1">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Net Balance</h3>
              <p className={`text-2xl sm:text-3xl font-bold ${report.totals.totalNetBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(report.totals.totalNetBalance)}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
            {/* Category breakdown pie chart */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Expense Breakdown by Category</h2>
              <div className="h-64 sm:h-80">
                {expenseChartData.length > 0 ? (
                  <PieChart data={expenseChartData} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm sm:text-base">
                    No expense data available
                  </div>
                )}
              </div>
            </div>

            {/* Month comparison bar chart */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Monthly Comparison</h2>
              <div className="h-64 sm:h-80">
                {monthComparisonData.length > 0 ? (
                  <BarChart data={monthComparisonData} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm sm:text-base">
                    No monthly data available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Net balance trend line chart */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Net Balance Trend</h2>
            <div className="h-64 sm:h-80">
              {netBalanceData.length > 0 ? (
                <LineChart data={netBalanceData} lineName="Net Balance" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm sm:text-base">
                  No trend data available
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* No data state */}
      {!loading && !report && !error && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">No data available for the selected date range</p>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
