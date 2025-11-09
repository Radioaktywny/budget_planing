import apiClient from './api';
import { ImportRequest, ParsedTransaction } from '../types';

export const importService = {
  // Import from JSON
  importJSON: async (data: ImportRequest): Promise<ParsedTransaction[]> => {
    const response = await apiClient.post<ParsedTransaction[]>('/import/json', data);
    return response.data;
  },

  // Import from YAML
  importYAML: async (yamlContent: string): Promise<ParsedTransaction[]> => {
    const response = await apiClient.post<ParsedTransaction[]>('/import/yaml', {
      yaml: yamlContent,
    });
    return response.data;
  },

  // Get import schema documentation
  getSchema: async (): Promise<any> => {
    const response = await apiClient.get('/import/schema');
    return response.data;
  },

  // Validate import file
  validate: async (data: ImportRequest): Promise<{ valid: boolean; errors?: string[] }> => {
    const response = await apiClient.post<{ valid: boolean; errors?: string[] }>(
      '/import/validate',
      data
    );
    return response.data;
  },
};
