import { Router } from 'express';
import { aiController } from '../controllers/aiController';

const router = Router();

/**
 * POST /api/ai/suggest-category
 * Get category suggestion for a transaction
 */
router.post('/suggest-category', aiController.suggestCategory);

/**
 * POST /api/ai/learn
 * Train the categorization model with user feedback
 */
router.post('/learn', aiController.learn);

export default router;
