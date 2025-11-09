import axios, { AxiosError } from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';
const AI_SERVICE_TIMEOUT = parseInt(process.env.AI_SERVICE_TIMEOUT || '30000', 10); // 30 seconds

export interface ParsedTransaction {
  date: string;
  amount: number;
  description: string;
  type: 'income' | 'expense';
  category?: string;
  confidence?: number;
}

export interface ParsedReceiptItem {
  description: string;
  amount: number;
  category?: string;
}

export interface ParsePDFResult {
  success: boolean;
  transactions: ParsedTransaction[];
  message?: string;
  error?: string;
}

export interface ParseReceiptResult {
  success: boolean;
  transaction?: ParsedTransaction;
  items?: ParsedReceiptItem[];
  message?: string;
  error?: string;
}

export const parsingService = {
  /**
   * Parse a PDF bank statement using the AI service
   */
  async parsePDF(filePath: string): Promise<ParsePDFResult> {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          transactions: [],
          error: 'File not found'
        };
      }

      // Create form data with file
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));

      // Call AI service
      const response = await axios.post(
        `${AI_SERVICE_URL}/parse/pdf`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: AI_SERVICE_TIMEOUT
        }
      );

      if (response.data.success) {
        return {
          success: true,
          transactions: response.data.transactions || [],
          message: response.data.message
        };
      } else {
        return {
          success: false,
          transactions: [],
          error: response.data.message || 'Failed to parse PDF'
        };
      }
    } catch (error) {
      return this.handleParsingError(error, 'PDF parsing');
    }
  },

  /**
   * Parse a receipt image using the AI service
   */
  async parseReceipt(filePath: string): Promise<ParseReceiptResult> {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: 'File not found'
        };
      }

      // Create form data with file
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));

      // Call AI service
      const response = await axios.post(
        `${AI_SERVICE_URL}/parse/receipt`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: AI_SERVICE_TIMEOUT
        }
      );

      if (response.data.success) {
        return {
          success: true,
          transaction: response.data.transaction,
          items: response.data.items || [],
          message: response.data.message
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to parse receipt'
        };
      }
    } catch (error) {
      return this.handleParsingError(error, 'Receipt parsing');
    }
  },

  /**
   * Check if AI service is available
   */
  async checkAIServiceHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/health`, {
        timeout: 5000
      });
      return response.status === 200 && response.data.status === 'healthy';
    } catch (error) {
      console.error('AI service health check failed:', error);
      return false;
    }
  },

  /**
   * Handle parsing errors with appropriate fallback
   */
  handleParsingError(error: unknown, operation: string): { success: false; transactions: []; error: string } {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ detail?: string }>;
      
      if (axiosError.code === 'ECONNREFUSED') {
        return {
          success: false,
          transactions: [],
          error: 'AI service is unavailable. Please ensure the service is running.'
        };
      }
      
      if (axiosError.code === 'ETIMEDOUT' || axiosError.code === 'ECONNABORTED') {
        return {
          success: false,
          transactions: [],
          error: 'AI service request timed out. The document may be too large or complex.'
        };
      }
      
      if (axiosError.response) {
        return {
          success: false,
          transactions: [],
          error: `AI service error: ${axiosError.response.data?.detail || axiosError.message}`
        };
      }
    }

    console.error(`${operation} error:`, error);
    return {
      success: false,
      transactions: [],
      error: `Failed to parse document: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  },

  /**
   * Create pending transactions from parsed data
   * These are stored temporarily for user review before final approval
   */
  async createPendingTransactions(
    documentId: string,
    transactions: ParsedTransaction[]
  ): Promise<any[]> {
    // For now, we'll return the transactions as-is
    // In a full implementation, you might store these in a separate "pending_transactions" table
    // or add a "pending" flag to the transactions table
    return transactions.map(t => ({
      ...t,
      documentId,
      pending: true
    }));
  }
};
