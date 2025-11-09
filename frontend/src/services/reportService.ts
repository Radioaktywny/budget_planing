import apiClient from './api';
import { 
  ReportSummary, 
  CategoryBreakdown, 
  NetBalancePoint, 
  MonthlySummary,
  ComprehensiveReport 
} from '../types';

export const reportService = {
  // Get summary report
  getSummary: async (startDate: string, endDate: string): Promise<ReportSummary> => {
    const response = await apiClient.get<ReportSummary>('/reports/summary', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  // Get category breakdown
  getCategoryBreakdown: async (
    startDate: string, 
    endDate: string,
    type?: 'INCOME' | 'EXPENSE'
  ): Promise<CategoryBreakdown[]> => {
    const response = await apiClient.get<CategoryBreakdown[]>('/reports/category-breakdown', {
      params: { startDate, endDate, type },
    });
    return response.data;
  },

  // Get net balance over time
  getNetBalance: async (startDate: string, endDate: string): Promise<NetBalancePoint[]> => {
    const response = await apiClient.get<NetBalancePoint[]>('/reports/net-balance', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  // Get comprehensive report
  getComprehensive: async (startDate: string, endDate: string): Promise<ComprehensiveReport> => {
    const response = await apiClient.get<ComprehensiveReport>('/reports/comprehensive', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  // Export PDF report
  exportPDF: async (startDate: string, endDate: string): Promise<void> => {
    const response = await apiClient.post(
      '/reports/export/pdf',
      { startDate, endDate },
      { responseType: 'blob' }
    );
    
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `budget-report-${startDate}-${endDate}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Export Excel report
  exportExcel: async (startDate: string, endDate: string): Promise<void> => {
    const response = await apiClient.post(
      '/reports/export/excel',
      { startDate, endDate },
      { responseType: 'blob' }
    );
    
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `budget-report-${startDate}-${endDate}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
