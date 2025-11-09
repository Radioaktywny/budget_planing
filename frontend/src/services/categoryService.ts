import apiClient from './api';
import { Category, CreateCategoryRequest, UpdateCategoryRequest, DeleteCategoryRequest } from '../types';

export const categoryService = {
  // Get all categories
  getAll: async (): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>('/categories');
    return response.data;
  },

  // Get category by ID
  getById: async (id: string): Promise<Category> => {
    const response = await apiClient.get<Category>(`/categories/${id}`);
    return response.data;
  },

  // Create new category
  create: async (data: CreateCategoryRequest): Promise<Category> => {
    const response = await apiClient.post<Category>('/categories', data);
    return response.data;
  },

  // Update category
  update: async (id: string, data: UpdateCategoryRequest): Promise<Category> => {
    const response = await apiClient.put<Category>(`/categories/${id}`, data);
    return response.data;
  },

  // Delete category
  delete: async (id: string, data?: DeleteCategoryRequest): Promise<void> => {
    await apiClient.delete(`/categories/${id}`, { data });
  },
};
