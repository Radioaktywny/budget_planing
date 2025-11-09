import apiClient from './api';
import { Tag, CreateTagRequest } from '../types';

export const tagService = {
  // Get all tags
  getAll: async (): Promise<Tag[]> => {
    const response = await apiClient.get<Tag[]>('/tags');
    return response.data;
  },

  // Get tag by ID
  getById: async (id: string): Promise<Tag> => {
    const response = await apiClient.get<Tag>(`/tags/${id}`);
    return response.data;
  },

  // Create new tag
  create: async (data: CreateTagRequest): Promise<Tag> => {
    const response = await apiClient.post<Tag>('/tags', data);
    return response.data;
  },

  // Delete tag
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tags/${id}`);
  },
};
