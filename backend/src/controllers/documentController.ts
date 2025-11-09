import { Request, Response } from 'express';
import { documentService } from '../services/documentService';
import { parsingService } from '../services/parsingService';
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
  },

  /**
   * Parse a document using AI service
   * POST /api/documents/parse
   */
  async parseDocument(req: Request, res: Response): Promise<void> {
    try {
      const { documentId } = req.body;

      if (!documentId) {
        res.status(400).json({
          error: {
            code: 'MISSING_DOCUMENT_ID',
            message: 'Document ID is required'
          }
        });
        return;
      }

      // Get document from database
      const document = await documentService.getDocumentById(documentId);

      if (!document) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Document not found'
          }
        });
        return;
      }

      // Get file path
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

      // Check AI service health
      const isHealthy = await parsingService.checkAIServiceHealth();
      if (!isHealthy) {
        res.status(503).json({
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'AI service is currently unavailable. Please try again later.'
          }
        });
        return;
      }

      // Get user's categories and accounts for better AI parsing
      const { getAllCategories } = await import('../services/categoryService');
      const { getAllAccounts } = await import('../services/accountService');
      
      // Get current user ID from request context
      const userId = (req as any).userId || 'default-user-id';
      
      const categories = await getAllCategories(userId);
      const accounts = await getAllAccounts(userId);
      
      const categoryNames = categories.map((c: any) => c.name);
      const accountNames = accounts.map((a: any) => a.name);
      
      console.log(`📋 Found ${categoryNames.length} categories and ${accountNames.length} accounts for AI`);

      // Parse document based on type
      let result;
      if (document.mimeType === 'application/pdf') {
        result = await parsingService.parsePDF(filePath, categoryNames, accountNames);
      } else if (document.mimeType.startsWith('image/')) {
        result = await parsingService.parseReceipt(filePath);
      } else {
        res.status(400).json({
          error: {
            code: 'UNSUPPORTED_TYPE',
            message: 'Unsupported document type for parsing'
          }
        });
        return;
      }

      // Handle parsing result
      if (!result.success) {
        res.status(500).json({
          error: {
            code: 'PARSING_FAILED',
            message: result.error || 'Failed to parse document'
          }
        });
        return;
      }

      // For PDF: return transactions array
      // For Receipt: return transaction and items
      if ('transactions' in result) {
        // PDF result
        const pendingTransactions = await parsingService.createPendingTransactions(
          documentId,
          result.transactions
        );

        res.json({
          success: true,
          documentId,
          documentType: 'pdf',
          transactions: pendingTransactions,
          message: result.message || `Successfully parsed ${pendingTransactions.length} transactions`
        });
      } else {
        // Receipt result
        const transactions = [];
        
        if (result.transaction) {
          // If there are items, create a split transaction
          if (result.items && result.items.length > 0) {
            transactions.push({
              ...result.transaction,
              documentId,
              pending: true,
              split: true,
              items: result.items
            });
          } else {
            // Single transaction
            transactions.push({
              ...result.transaction,
              documentId,
              pending: true
            });
          }
        }

        res.json({
          success: true,
          documentId,
          documentType: 'receipt',
          transactions,
          message: result.message || 'Successfully parsed receipt'
        });
      }
    } catch (error) {
      console.error('Error parsing document:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({
        error: {
          code: 'PARSE_ERROR',
          message: 'Failed to parse document',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }
};
