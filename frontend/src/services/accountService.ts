import apiClient from './api';
import { Account, CreateAccountRequest, UpdateAccountRequest } from '../types';

export const accountService = {
  // Get all accounts
  getAll: async (): Promise<Account[]> => {
    const response = await apiClient.get<Account[]>('/accounts');
    return response.data;
  },

  // Get account by ID
  getById: async (id: string): Promise<Account> => {
    const response = await apiClient.get<Account>(`/accounts/${id}`);
    return response.data;
  },

  // Create new account
  create: async (data: CreateAccountRequest): Promise<Account> => {
    const response = await apiClient.post<Account>('/accounts', data);
    return response.data;
  },

  // Update account
  update: async (id: string, data: UpdateAccountRequest): Promise<Account> => {
    const response = await apiClient.put<Account>(`/accounts/${id}`, data);
    return response.data;
  },

  // Delete account
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/accounts/${id}`);
  },

  // Get account balance
  getBalance: async (id: string): Promise<{ balance: number }> => {
    const response = await apiClient.get<{ balance: number }>(`/accounts/${id}/balance`);
    return response.data;
  },
};
