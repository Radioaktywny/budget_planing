import apiClient from './api';
import { CategorySuggestion } from '../types';

export const aiService = {
  // Get category suggestion for transaction
  suggestCategory: async (description: string, amount: number): Promise<CategorySuggestion> => {
    const response = await apiClient.post<CategorySuggestion>('/ai/suggest-category', {
      description,
      amount,
    });
    return response.data;
  },

  // Update categorization model with user correction
  learn: async (description: string, amount: number, categoryId: string): Promise<void> => {
    await apiClient.post('/ai/learn', {
      description,
      amount,
      categoryId,
    });
  },
};
