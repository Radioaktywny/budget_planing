import { Router } from 'express';
import { documentController } from '../controllers/documentController';
import upload from '../config/multer';

const router = Router();

/**
 * POST /api/documents/upload
 * Upload a document (PDF, JPEG, PNG)
 */
router.post('/upload', upload.single('file'), documentController.uploadDocument);

/**
 * GET /api/documents/:id
 * Download a document by ID
 */
router.get('/:id', documentController.downloadDocument);

/**
 * GET /api/documents/:id/transactions
 * Get all transactions linked to a document
 */
router.get('/:id/transactions', documentController.getDocumentTransactions);

/**
 * POST /api/documents/parse
 * Parse a document using AI service
 */
router.post('/parse', documentController.parseDocument);

export default router;
