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
    // TODO: Replace with actual user authentication
    const userId = 'c33d4026-e045-4e76-a586-9b8f58d669a1';
    const response = await apiClient.get<{ success: boolean; data: ReportSummary }>('/reports/summary', {
      params: { userId, startDate, endDate },
    });
    return response.data.data;
  },

  // Get category breakdown
  getCategoryBreakdown: async (
    startDate: string, 
    endDate: string,
    type?: 'INCOME' | 'EXPENSE'
  ): Promise<CategoryBreakdown[]> => {
    // TODO: Replace with actual user authentication
    const userId = 'c33d4026-e045-4e76-a586-9b8f58d669a1';
    const response = await apiClient.get<{ success: boolean; data: CategoryBreakdown[] }>('/reports/category-breakdown', {
      params: { userId, startDate, endDate, type },
    });
    return response.data.data;
  },

  // Get net balance over time
  getNetBalance: async (startDate: string, endDate: string): Promise<NetBalancePoint[]> => {
    // TODO: Replace with actual user authentication
    const userId = 'c33d4026-e045-4e76-a586-9b8f58d669a1';
    const response = await apiClient.get<{ success: boolean; data: NetBalancePoint[] }>('/reports/net-balance', {
      params: { userId, startDate, endDate },
    });
    return response.data.data;
  },

  // Get comprehensive report
  getComprehensive: async (startDate: string, endDate: string): Promise<ComprehensiveReport> => {
    // TODO: Replace with actual user authentication
    const userId = 'c33d4026-e045-4e76-a586-9b8f58d669a1';
    const response = await apiClient.get<{ success: boolean; data: ComprehensiveReport }>('/reports/comprehensive', {
      params: { userId, startDate, endDate },
    });
    return response.data.data;
  },

  // Export PDF report
  exportPDF: async (startDate: string, endDate: string): Promise<void> => {
    // TODO: Replace with actual user authentication
    const userId = 'c33d4026-e045-4e76-a586-9b8f58d669a1';
    const response = await apiClient.post(
      '/reports/export/pdf',
      { userId, startDate, endDate },
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
    // TODO: Replace with actual user authentication
    const userId = 'c33d4026-e045-4e76-a586-9b8f58d669a1';
    const response = await apiClient.post(
      '/reports/export/excel',
      { userId, startDate, endDate },
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
