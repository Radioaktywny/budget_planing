import apiClient from './api';
import { ImportRequest, ParsedTransaction } from '../types';

interface ImportPreview {
  transactions: ParsedTransaction[];
  warnings: string[];
  document?: {
    filename?: string;
    date?: string;
  };
}

interface ImportResponse {
  success: boolean;
  preview: ImportPreview;
}

interface ValidationResponse {
  valid: boolean;
  message?: string;
  transactionCount?: number;
  errors?: Array<{
    field: string;
    message: string;
    index?: number;
  }>;
}

export const importService = {
  // Import from JSON
  importJSON: async (data: ImportRequest): Promise<ImportResponse> => {
    const response = await apiClient.post<ImportResponse>('/import/json', data);
    return response.data;
  },

  // Import from YAML
  importYAML: async (yamlContent: string): Promise<ImportResponse> => {
    const response = await apiClient.post<ImportResponse>('/import/yaml', {
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
  validate: async (data: ImportRequest | { yaml: string }): Promise<ValidationResponse> => {
    const response = await apiClient.post<ValidationResponse>(
      '/import/validate',
      data
    );
    return response.data;
  },
};
