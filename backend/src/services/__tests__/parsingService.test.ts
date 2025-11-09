import { parsingService } from '../parsingService';
import axios from 'axios';
import fs from 'fs';
import { Readable } from 'stream';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock fs
jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

// Helper to create a mock stream
const createMockStream = () => {
  const stream = new Readable();
  stream.push('mock file content');
  stream.push(null);
  return stream;
};

describe('Parsing Service', () => {
  const testFilePath = './uploads/test-document.pdf';
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parsePDF', () => {
    it('should successfully parse a PDF document', async () => {
      // Mock file exists
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.createReadStream.mockReturnValue(createMockStream() as any);

      // Mock successful AI service response
      const mockTransactions = [
        {
          date: '2024-01-15',
          amount: 100.50,
          description: 'Grocery Store',
          type: 'expense'
        },
        {
          date: '2024-01-20',
          amount: 3000.00,
          description: 'Salary Payment',
          type: 'income'
        }
      ];

      mockedAxios.post.mockResolvedValue({
        data: {
          success: true,
          transactions: mockTransactions,
          message: 'Successfully parsed 2 transactions'
        }
      });

      const result = await parsingService.parsePDF(testFilePath);

      expect(result.success).toBe(true);
      expect(result.transactions).toHaveLength(2);
      expect(result.transactions[0].description).toBe('Grocery Store');
      expect(result.transactions[1].amount).toBe(3000.00);
      expect(result.message).toBe('Successfully parsed 2 transactions');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${AI_SERVICE_URL}/parse/pdf`,
        expect.any(Object),
        expect.objectContaining({
          timeout: expect.any(Number)
        })
      );
    });

    it('should return error when file does not exist', async () => {
      mockedFs.existsSync.mockReturnValue(false);

      const result = await parsingService.parsePDF(testFilePath);

      expect(result.success).toBe(false);
      expect(result.transactions).toHaveLength(0);
      expect(result.error).toBe('File not found');
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should handle AI service connection refused error', async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.createReadStream.mockReturnValue(createMockStream() as any);

      const connectionError = new Error('Connection refused');
      (connectionError as any).code = 'ECONNREFUSED';
      (connectionError as any).isAxiosError = true;
      mockedAxios.post.mockRejectedValue(connectionError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = await parsingService.parsePDF(testFilePath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('AI service is unavailable');
    });

    it('should handle AI service timeout error', async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.createReadStream.mockReturnValue(createMockStream() as any);

      const timeoutError = new Error('Timeout');
      (timeoutError as any).code = 'ETIMEDOUT';
      (timeoutError as any).isAxiosError = true;
      mockedAxios.post.mockRejectedValue(timeoutError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = await parsingService.parsePDF(testFilePath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out');
    });

    it('should handle AI service error response', async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.createReadStream.mockReturnValue(createMockStream() as any);

      const errorResponse = {
        response: {
          data: {
            detail: 'Invalid PDF format'
          }
        },
        isAxiosError: true
      };
      mockedAxios.post.mockRejectedValue(errorResponse);
      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = await parsingService.parsePDF(testFilePath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid PDF format');
    });
  });

  describe('parseReceipt', () => {
    const testImagePath = './uploads/test-receipt.jpg';

    it('should successfully parse a receipt with items', async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.createReadStream.mockReturnValue(createMockStream() as any);

      const mockResponse = {
        success: true,
        transaction: {
          date: '2024-01-18',
          amount: 85.50,
          description: 'Walmart Receipt',
          type: 'expense'
        },
        items: [
          { description: 'Groceries', amount: 35.00 },
          { description: 'USB Cable', amount: 40.00 },
          { description: 'Shampoo', amount: 10.50 }
        ],
        message: 'Successfully parsed receipt with 3 items'
      };

      mockedAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await parsingService.parseReceipt(testImagePath);

      expect(result.success).toBe(true);
      expect(result.transaction).toBeDefined();
      expect(result.transaction?.amount).toBe(85.50);
      expect(result.items).toHaveLength(3);
      expect(result.items?.[0].description).toBe('Groceries');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${AI_SERVICE_URL}/parse/receipt`,
        expect.any(Object),
        expect.objectContaining({
          timeout: expect.any(Number)
        })
      );
    });

    it('should successfully parse a receipt without items', async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.createReadStream.mockReturnValue(createMockStream() as any);

      const mockResponse = {
        success: true,
        transaction: {
          date: '2024-01-15',
          amount: 50.00,
          description: 'Coffee Shop',
          type: 'expense'
        },
        items: [],
        message: 'Successfully parsed receipt'
      };

      mockedAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await parsingService.parseReceipt(testImagePath);

      expect(result.success).toBe(true);
      expect(result.transaction).toBeDefined();
      expect(result.items).toHaveLength(0);
    });

    it('should return error when file does not exist', async () => {
      mockedFs.existsSync.mockReturnValue(false);

      const result = await parsingService.parseReceipt(testImagePath);

      expect(result.success).toBe(false);
      expect(result.error).toBe('File not found');
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should handle connection errors', async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.createReadStream.mockReturnValue(createMockStream() as any);

      const connectionError = new Error('Connection refused');
      (connectionError as any).code = 'ECONNREFUSED';
      (connectionError as any).isAxiosError = true;
      mockedAxios.post.mockRejectedValue(connectionError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = await parsingService.parseReceipt(testImagePath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('AI service is unavailable');
    });
  });

  describe('checkAIServiceHealth', () => {
    it('should return true when AI service is healthy', async () => {
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: { status: 'healthy' }
      });

      const result = await parsingService.checkAIServiceHealth();

      expect(result).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${AI_SERVICE_URL}/health`,
        expect.objectContaining({
          timeout: 5000
        })
      );
    });

    it('should return false when AI service is unhealthy', async () => {
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: { status: 'unhealthy' }
      });

      const result = await parsingService.checkAIServiceHealth();

      expect(result).toBe(false);
    });

    it('should return false when AI service is unreachable', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Connection refused'));

      const result = await parsingService.checkAIServiceHealth();

      expect(result).toBe(false);
    });

    it('should return false when request times out', async () => {
      const timeoutError = new Error('Timeout');
      (timeoutError as any).code = 'ETIMEDOUT';
      mockedAxios.get.mockRejectedValue(timeoutError);

      const result = await parsingService.checkAIServiceHealth();

      expect(result).toBe(false);
    });
  });

  describe('createPendingTransactions', () => {
    it('should create pending transactions with document ID', async () => {
      const documentId = 'doc-123';
      const transactions = [
        {
          date: '2024-01-15',
          amount: 100.50,
          description: 'Test Transaction',
          type: 'expense' as const
        }
      ];

      const result = await parsingService.createPendingTransactions(
        documentId,
        transactions
      );

      expect(result).toHaveLength(1);
      expect(result[0].documentId).toBe(documentId);
      expect(result[0].pending).toBe(true);
      expect(result[0].description).toBe('Test Transaction');
    });

    it('should handle multiple transactions', async () => {
      const documentId = 'doc-456';
      const transactions = [
        {
          date: '2024-01-15',
          amount: 100.50,
          description: 'Transaction 1',
          type: 'expense' as const
        },
        {
          date: '2024-01-20',
          amount: 3000.00,
          description: 'Transaction 2',
          type: 'income' as const
        }
      ];

      const result = await parsingService.createPendingTransactions(
        documentId,
        transactions
      );

      expect(result).toHaveLength(2);
      expect(result[0].documentId).toBe(documentId);
      expect(result[1].documentId).toBe(documentId);
      expect(result[0].pending).toBe(true);
      expect(result[1].pending).toBe(true);
    });

    it('should handle empty transactions array', async () => {
      const documentId = 'doc-789';
      const transactions: any[] = [];

      const result = await parsingService.createPendingTransactions(
        documentId,
        transactions
      );

      expect(result).toHaveLength(0);
    });
  });
});
