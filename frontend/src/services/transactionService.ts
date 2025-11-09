import apiClient from './api';
import {
  Transaction,
  CreateTransactionRequest,
  CreateSplitTransactionRequest,
  CreateTransferRequest,
  TransactionFilters,
  TransactionListResponse,
} from '../types';

export const transactionService = {
  // Get all transactions with filters
  getAll: async (filters?: TransactionFilters): Promise<TransactionListResponse> => {
    const response = await apiClient.get<TransactionListResponse>('/transactions', {
      params: filters,
    });
    return response.data;
  },

  // Get transaction by ID
  getById: async (id: string): Promise<Transaction> => {
    const response = await apiClient.get<Transaction>(`/transactions/${id}`);
    return response.data;
  },

  // Create new transaction
  create: async (data: CreateTransactionRequest): Promise<Transaction> => {
    const response = await apiClient.post<Transaction>('/transactions', data);
    return response.data;
  },

  // Create split transaction
  createSplit: async (data: CreateSplitTransactionRequest): Promise<Transaction> => {
    const response = await apiClient.post<Transaction>('/transactions/split', data);
    return response.data;
  },

  // Create transfer
  createTransfer: async (data: CreateTransferRequest): Promise<Transaction> => {
    const response = await apiClient.post<Transaction>('/transactions/transfer', data);
    return response.data;
  },

  // Update transaction
  update: async (id: string, data: Partial<CreateTransactionRequest>): Promise<Transaction> => {
    const response = await apiClient.put<Transaction>(`/transactions/${id}`, data);
    return response.data;
  },

  // Delete transaction
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/transactions/${id}`);
  },

  // Get split items for a parent transaction
  getSplitItems: async (id: string): Promise<Transaction[]> => {
    const response = await apiClient.get<Transaction[]>(`/transactions/${id}/items`);
    return response.data;
  },

  // Bulk create transactions
  bulkCreate: async (transactions: CreateTransactionRequest[]): Promise<Transaction[]> => {
    const response = await apiClient.post<Transaction[]>('/transactions/bulk', { transactions });
    return response.data;
  },
};
