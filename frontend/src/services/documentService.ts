import apiClient from './api';
import { Document, ParsedTransaction, Transaction } from '../types';

export const documentService = {
  // Upload document
  upload: async (file: File): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<{ message: string; document: Document }>('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.document;
  },

  // Parse document
  parse: async (documentId: string): Promise<ParsedTransaction[]> => {
    const response = await apiClient.post<{ 
      success: boolean; 
      documentId: string; 
      documentType: string;
      transactions: ParsedTransaction[];
      message: string;
    }>('/documents/parse', {
      documentId,
    });
    return response.data.transactions;
  },

  // Get document by ID
  getById: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/documents/${id}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Get transactions linked to document
  getTransactions: async (id: string): Promise<Transaction[]> => {
    const response = await apiClient.get<Transaction[]>(`/documents/${id}/transactions`);
    return response.data;
  },

  // Download document
  download: async (id: string, filename: string): Promise<void> => {
    const blob = await documentService.getById(id);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
