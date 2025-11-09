import { Request, Response } from 'express';
import { documentService } from '../services/documentService';
import path from 'path';
import fs from 'fs';

export const documentController = {
  /**
   * Upload a document
   * POST /api/documents/upload
   */
  async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ 
          error: { 
            code: 'NO_FILE', 
            message: 'No file uploaded' 
          } 
        });
        return;
      }

      const file = req.file;

      // Create document record
      const document = await documentService.createDocument({
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: documentService.generateFilePath(file.filename)
      });

      res.status(201).json({
        message: 'Document uploaded successfully',
        document: {
          id: document.id,
          filename: document.filename,
          originalName: document.originalName,
          mimeType: document.mimeType,
          size: document.size,
          uploadedAt: document.uploadedAt
        }
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({ 
        error: { 
          code: 'UPLOAD_ERROR', 
          message: 'Failed to upload document' 
        } 
      });
    }
  },

  /**
   * Download a document
   * GET /api/documents/:id
   */
  async downloadDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const document = await documentService.getDocumentById(id);

      if (!document) {
        res.status(404).json({ 
          error: { 
            code: 'NOT_FOUND', 
            message: 'Document not found' 
          } 
        });
        return;
      }

      const filePath = path.join(process.cwd(), document.path);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        res.status(404).json({ 
          error: { 
            code: 'FILE_NOT_FOUND', 
            message: 'Document file not found on server' 
          } 
        });
        return;
      }

      // Set headers for download
      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
      res.setHeader('Content-Length', document.size.toString());

      // Stream file to response
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error downloading document:', error);
      res.status(500).json({ 
        error: { 
          code: 'DOWNLOAD_ERROR', 
          message: 'Failed to download document' 
        } 
      });
    }
  },

  /**
   * Get transactions linked to a document
   * GET /api/documents/:id/transactions
   */
  async getDocumentTransactions(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const transactions = await documentService.getDocumentTransactions(id);

      if (transactions === null) {
        res.status(404).json({ 
          error: { 
            code: 'NOT_FOUND', 
            message: 'Document not found' 
          } 
        });
        return;
      }

      res.json({
        documentId: id,
        transactions: transactions.map(transaction => ({
          id: transaction.id,
          date: transaction.date,
          amount: transaction.amount,
          type: transaction.type,
          description: transaction.description,
          notes: transaction.notes,
          account: {
            id: transaction.account.id,
            name: transaction.account.name,
            type: transaction.account.type
          },
          category: transaction.category ? {
            id: transaction.category.id,
            name: transaction.category.name
          } : null,
          tags: transaction.tags.map(tt => ({
            id: tt.tag.id,
            name: tt.tag.name
          })),
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt
        }))
      });
    } catch (error) {
      console.error('Error fetching document transactions:', error);
      res.status(500).json({ 
        error: { 
          code: 'FETCH_ERROR', 
          message: 'Failed to fetch document transactions' 
        } 
      });
    }
  }
};
