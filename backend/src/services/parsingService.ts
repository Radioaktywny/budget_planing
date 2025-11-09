import axios, { AxiosError } from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';
// Increased timeout for AI parsing (Gemini can take 30-60 seconds for large PDFs)
const AI_SERVICE_TIMEOUT = parseInt(process.env.AI_SERVICE_TIMEOUT || '300000', 10); // 300 seconds (5 minutes)

export interface ParsedTransaction {
  date: string;
  amount: number;
  description: string;
  type: 'INCOME' | 'EXPENSE'; // Uppercase to match backend enum
  category?: string;
  account?: string;
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
  async parsePDF(filePath: string, categories?: string[], accounts?: string[]): Promise<ParsePDFResult> {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          transactions: [],
          error: 'File not found'
        };
      }

      console.log(`📤 Sending PDF to AI service: ${filePath}`);

      // Create form data with file
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));
      
      // Add categories and accounts if provided
      if (categories && categories.length > 0) {
        formData.append('categories', categories.join(','));
        console.log(`📋 Sending ${categories.length} categories to AI`);
      }
      if (accounts && accounts.length > 0) {
        formData.append('accounts', accounts.join(','));
        console.log(`🏦 Sending ${accounts.length} accounts to AI`);
      }

      // Call AI service
      console.log(`⏱️  Calling AI service with ${AI_SERVICE_TIMEOUT}ms timeout...`);
      const response = await axios.post(
        `${AI_SERVICE_URL}/parse/pdf`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: AI_SERVICE_TIMEOUT
        }
      );
      console.log(`✅ Received response from AI service`);

      if (response.data.success) {
        // Convert transaction types to uppercase to match backend enum
        const transactions = (response.data.transactions || []).map((t: any) => ({
          ...t,
          type: t.type.toUpperCase() as 'INCOME' | 'EXPENSE'
        }));
        
        return {
          success: true,
          transactions,
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
        // Convert transaction type to uppercase if present
        const transaction = response.data.transaction ? {
          ...response.data.transaction,
          type: response.data.transaction.type.toUpperCase() as 'INCOME' | 'EXPENSE'
        } : undefined;
        
        return {
          success: true,
          transaction,
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
  handleParsingError(error: unknown, operation: string): any {
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
        const errorMessage = axiosError.response.data?.detail || axiosError.message;
        console.error(`${operation} error response:`, axiosError.response.data);
        return {
          success: false,
          transactions: [],
          error: `AI service error: ${errorMessage}`
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
