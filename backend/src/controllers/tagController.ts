import { Request, Response } from 'express';
import * as tagService from '../services/tagService';

export const tagController = {
  /**
   * GET /api/tags
   * Get all tags for a user with usage counts
   */
  async getAllTags(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.query.userId as string;

      if (!userId) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'User ID is required'
          }
        });
        return;
      }

      const tags = await tagService.getAllTags(userId);
      res.json(tags);
    } catch (error) {
      console.error('Error in getAllTags:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch tags',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  },

  /**
   * POST /api/tags
   * Create a new tag
   */
  async createTag(req: Request, res: Response): Promise<void> {
    try {
      const tag = await tagService.createTag(req.body);
      res.status(201).json(tag);
    } catch (error) {
      console.error('Error in createTag:', error);
      
      if (error instanceof Error && error.message.includes('validation')) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create tag',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  },

  /**
   * DELETE /api/tags/:id
   * Delete a tag
   */
  async deleteTag(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.query.userId as string;

      if (!userId) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'User ID is required'
          }
        });
        return;
      }

      await tagService.deleteTag(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error('Error in deleteTag:', error);
      
      if (error instanceof Error && error.message === 'Tag not found') {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Tag not found'
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete tag',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }
};