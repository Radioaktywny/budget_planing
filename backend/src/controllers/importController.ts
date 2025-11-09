import { Request, Response } from 'express';
import * as importService from '../services/importService';
import { getUserId } from '../middleware/userContext';

/**
 * POST /api/import/json
 * Import transactions from JSON format
 */
export async function importJSON(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    
    // Get JSON string from request body
    const jsonString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    
    // Parse and validate JSON
    const validationResult = importService.parseJSON(jsonString);
    
    if (!validationResult.valid) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid import data',
          details: validationResult.errors,
        },
      });
      return;
    }
    
    if (!validationResult.data) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No data to import',
        },
      });
      return;
    }
    
    // Process import data and generate preview
    const preview = await importService.processImportData(validationResult.data, userId);
    
    res.json({
      success: true,
      preview,
    });
  } catch (error) {
    console.error('Error importing JSON:', error);
    
    if (error instanceof Error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      });
      return;
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to import JSON data',
      },
    });
  }
}

/**
 * POST /api/import/yaml
 * Import transactions from YAML format
 */
export async function importYAML(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    
    // Get YAML string from request body
    let yamlString: string;
    
    if (typeof req.body === 'string') {
      yamlString = req.body;
    } else if (req.body.yaml) {
      yamlString = req.body.yaml;
    } else {
      res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'YAML string is required in request body',
        },
      });
      return;
    }
    
    // Parse and validate YAML
    const validationResult = importService.parseYAML(yamlString);
    
    if (!validationResult.valid) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid import data',
          details: validationResult.errors,
        },
      });
      return;
    }
    
    if (!validationResult.data) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No data to import',
        },
      });
      return;
    }
    
    // Process import data and generate preview
    const preview = await importService.processImportData(validationResult.data, userId);
    
    res.json({
      success: true,
      preview,
    });
  } catch (error) {
    console.error('Error importing YAML:', error);
    
    if (error instanceof Error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      });
      return;
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to import YAML data',
      },
    });
  }
}

/**
 * GET /api/import/schema
 * Get JSON/YAML schema documentation
 */
export async function getSchema(_req: Request, res: Response): Promise<void> {
  try {
    const schema = importService.getImportSchema();
    res.json(schema);
  } catch (error) {
    console.error('Error fetching schema:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch schema',
      },
    });
  }
}

/**
 * POST /api/import/validate
 * Validate import data without processing
 */
export async function validateImport(req: Request, res: Response): Promise<void> {
  try {
    // Determine format from content-type or body
    const contentType = req.headers['content-type'] || '';
    let validationResult: importService.ValidationResult;
    
    if (contentType.includes('yaml') || contentType.includes('yml')) {
      // YAML format
      const yamlString = typeof req.body === 'string' ? req.body : req.body.yaml;
      if (!yamlString) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'YAML string is required',
          },
        });
        return;
      }
      validationResult = importService.parseYAML(yamlString);
    } else {
      // JSON format (default)
      const jsonString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      validationResult = importService.parseJSON(jsonString);
    }
    
    if (validationResult.valid) {
      res.json({
        valid: true,
        message: 'Import data is valid',
        transactionCount: validationResult.data?.transactions.length || 0,
      });
    } else {
      res.status(400).json({
        valid: false,
        errors: validationResult.errors,
      });
    }
  } catch (error) {
    console.error('Error validating import:', error);
    
    if (error instanceof Error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      });
      return;
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to validate import data',
      },
    });
  }
}
