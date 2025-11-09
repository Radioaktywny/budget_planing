import { PrismaClient, Document } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export interface CreateDocumentData {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
}

export const documentService = {
  /**
   * Create a new document record in the database
   */
  async createDocument(data: CreateDocumentData): Promise<Document> {
    const document = await prisma.document.create({
      data: {
        filename: data.filename,
        originalName: data.originalName,
        mimeType: data.mimeType,
        size: data.size,
        path: data.path
      }
    });

    return document;
  },

  /**
   * Get document by ID
   */
  async getDocumentById(id: string): Promise<Document | null> {
    const document = await prisma.document.findUnique({
      where: { id }
    });

    return document;
  },

  /**
   * Get all transactions linked to a document
   */
  async getDocumentTransactions(documentId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        transactions: {
          include: {
            account: true,
            category: true,
            tags: {
              include: {
                tag: true
              }
            }
          },
          orderBy: {
            date: 'desc'
          }
        }
      }
    });

    if (!document) {
      return null;
    }

    return document.transactions;
  },

  /**
   * Delete document and its file
   */
  async deleteDocument(id: string): Promise<void> {
    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), document.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete database record
    await prisma.document.delete({
      where: { id }
    });
  },

  /**
   * Validate file type
   */
  validateFileType(mimeType: string): boolean {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];
    return allowedTypes.includes(mimeType);
  },

  /**
   * Validate file size
   */
  validateFileSize(size: number): boolean {
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10); // 10MB
    return size <= maxSize;
  },

  /**
   * Generate file path for storage
   */
  generateFilePath(filename: string): string {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    return path.join(uploadDir, filename);
  }
};
