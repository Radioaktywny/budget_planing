import { Router } from 'express';
import { tagController } from '../controllers/tagController';

const router = Router();

/**
 * GET /api/tags
 * Get all tags for the current user
 */
router.get('/', tagController.getAllTags);

/**
 * POST /api/tags
 * Create a new tag
 */
router.post('/', tagController.createTag);

/**
 * DELETE /api/tags/:id
 * Delete a tag
 */
router.delete('/:id', tagController.deleteTag);

export default router;
