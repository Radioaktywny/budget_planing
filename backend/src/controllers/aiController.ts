import { Request, Response } from 'express';
import { aiService } from '../services/aiService';

export const aiController = {
  /**
   * POST /api/ai/suggest-category
   * Get category suggestion for a transaction
   */
  async suggestCategory(req: Request, res: Response): Promise<void> {
    try {
      const { description, amount } = req.body;

      if (!description) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Description is required'
          }
        });
        return;
      }

      const result = await aiService.suggestCategory(description, amount);

      if (result.success && result.suggestion) {
        res.json({
          success: true,
          suggestion: result.suggestion
        });
      } else {
        // AI service unavailable - return default uncategorized
        res.json({
          success: true,
          suggestion: {
            category: 'Uncategorized',
            confidence: 0.0
          },
          message: result.error || 'AI service unavailable, using default category'
        });
      }
    } catch (error) {
      console.error('Error in suggestCategory:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get category suggestion',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  },

  /**
   * POST /api/ai/learn
   * Train the categorization model with user feedback
   */
  async learn(req: Request, res: Response): Promise<void> {
    try {
      const { description, category, amount } = req.body;

      if (!description || !category) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Description and category are required'
          }
        });
        return;
      }

      const result = await aiService.learnFromCorrection(
        description,
        category,
        amount
      );

      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        res.status(503).json({
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: result.message || 'Failed to train categorization model',
            details: result.error
          }
        });
      }
    } catch (error) {
      console.error('Error in learn:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to train categorization model',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }
};
