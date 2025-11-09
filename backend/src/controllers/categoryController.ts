import { Request, Response } from 'express';
import * as categoryService from '../services/categoryService';
import { getUserId } from '../middleware/userContext';
import { z } from 'zod';

/**
 * GET /api/categories
 * Get all categories for the current user
 * Query params:
 *   - hierarchy: if 'true', returns categories in tree structure
 */
export async function getAllCategories(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    const { hierarchy } = req.query;

    let categories;
    if (hierarchy === 'true') {
      categories = await categoryService.getCategoryHierarchy(userId);
    } else {
      categories = await categoryService.getAllCategories(userId);
    }

    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch categories',
      },
    });
  }
}

/**
 * GET /api/categories/:id
 * Get a single category by ID
 */
export async function getCategoryById(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const category = await categoryService.getCategoryById(id, userId);
    
    if (!category) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Category not found',
        },
      });
      return;
    }

    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch category',
      },
    });
  }
}

/**
 * POST /api/categories
 * Create a new category
 */
export async function createCategory(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    
    const categoryData = {
      ...req.body,
      userId,
    };

    const category = await categoryService.createCategory(categoryData);
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid category data',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
      return;
    }

    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        res.status(409).json({
          error: {
            code: 'CONFLICT',
            message: error.message,
          },
        });
        return;
      }

      if (error.message.includes('not found')) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
        return;
      }

      res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: error.message,
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create category',
      },
    });
  }
}

/**
 * PUT /api/categories/:id
 * Update an existing category
 */
export async function updateCategory(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const category = await categoryService.updateCategory(id, userId, req.body);
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid category data',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
      return;
    }

    if (error instanceof Error) {
      if (error.message === 'Category not found' || error.message === 'Parent category not found') {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
        return;
      }

      if (error.message.includes('already exists')) {
        res.status(409).json({
          error: {
            code: 'CONFLICT',
            message: error.message,
          },
        });
        return;
      }

      if (error.message.includes('circular') || error.message.includes('own parent') || error.message.includes('descendant')) {
        res.status(400).json({
          error: {
            code: 'INVALID_HIERARCHY',
            message: error.message,
          },
        });
        return;
      }

      res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: error.message,
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update category',
      },
    });
  }
}

/**
 * DELETE /api/categories/:id
 * Delete a category
 * Query params:
 *   - reassignTo: category ID to reassign transactions to (required if category has transactions)
 */
export async function deleteCategory(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { reassignTo } = req.query;

    await categoryService.deleteCategory(id, userId, reassignTo as string | undefined);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting category:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Category not found' || error.message === 'Reassignment category not found') {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
        return;
      }

      if (error.message.includes('Cannot delete') || error.message.includes('Cannot reassign')) {
        res.status(409).json({
          error: {
            code: 'CONFLICT',
            message: error.message,
          },
        });
        return;
      }

      res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: error.message,
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete category',
      },
    });
  }
}
