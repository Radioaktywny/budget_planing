import { Router } from 'express';
import * as importController from '../controllers/importController';

const router = Router();

// POST /api/import/json - Import transactions from JSON
router.post('/json', importController.importJSON);

// POST /api/import/yaml - Import transactions from YAML
router.post('/yaml', importController.importYAML);

// GET /api/import/schema - Get import schema documentation
router.get('/schema', importController.getSchema);

// POST /api/import/validate - Validate import data
router.post('/validate', importController.validateImport);

export default router;
