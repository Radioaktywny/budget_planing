import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import * as yaml from 'js-yaml';

const prisma = new PrismaClient();

// Validation schemas for import data
export const ImportTransactionItemSchema = z.object({
  amount: z.number().positive('Item amount must be greater than 0'),
  description: z.string().min(1, 'Item description is required'),
  category: z.string().optional(),
  notes: z.string().optional().nullable(),
});

export const ImportTransactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  amount: z.number().positive('Amount must be greater than 0'),
  type: z.enum(['income', 'expense', 'transfer'], {
    errorMap: () => ({ message: 'Type must be "income", "expense", or "transfer"' }),
  }),
  description: z.string().min(1, 'Description is required'),
  category: z.string().optional(),
  account: z.string().min(1, 'Account name is required'),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  split: z.boolean().optional(),
  items: z.array(ImportTransactionItemSchema).optional(),
});

export const ImportDocumentSchema = z.object({
  filename: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
});

export const ImportDataSchema = z.object({
  version: z.string(),
  source: z.string().optional(),
  document: ImportDocumentSchema.optional(),
  transactions: z.array(ImportTransactionSchema).min(1, 'At least one transaction is required'),
});

export type ImportTransactionItem = z.infer<typeof ImportTransactionItemSchema>;
export type ImportTransaction = z.infer<typeof ImportTransactionSchema>;
export type ImportDocument = z.infer<typeof ImportDocumentSchema>;
export type ImportData = z.infer<typeof ImportDataSchema>;

export interface ValidationError {
  field: string;
  message: string;
  index?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  data?: ImportData;
}

export interface ParsedTransaction {
  date: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  description: string;
  category?: string;
  categoryId?: string;
  account: string;
  accountId?: string;
  notes?: string;
  tags?: string[];
  tagIds?: string[];
  split?: boolean;
  items?: Array<{
    amount: number;
    description: string;
    category?: string;
    categoryId?: string;
    notes?: string;
  }>;
}

export interface ImportPreview {
  transactions: ParsedTransaction[];
  warnings: string[];
  document?: ImportDocument;
}

/**
 * Parse JSON import data
 */
export function parseJSON(jsonString: string): ValidationResult {
  try {
    const data = JSON.parse(jsonString);
    return validateImportData(data);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        valid: false,
        errors: [
          {
            field: 'json',
            message: `Invalid JSON format: ${error.message}`,
          },
        ],
      };
    }
    throw error;
  }
}

/**
 * Parse YAML import data
 */
export function parseYAML(yamlString: string): ValidationResult {
  try {
    const data = yaml.load(yamlString);
    return validateImportData(data);
  } catch (error) {
    if (error instanceof yaml.YAMLException) {
      return {
        valid: false,
        errors: [
          {
            field: 'yaml',
            message: `Invalid YAML format: ${error.message}`,
          },
        ],
      };
    }
    throw error;
  }
}

/**
 * Validate import data against schema
 */
export function validateImportData(data: any): ValidationResult {
  try {
    const validated = ImportDataSchema.parse(data);
    
    // Additional validation for split transactions
    const errors: ValidationError[] = [];
    
    validated.transactions.forEach((transaction, index) => {
      // If split is true, items must be provided
      if (transaction.split && (!transaction.items || transaction.items.length === 0)) {
        errors.push({
          field: `transactions[${index}].items`,
          message: 'Split transactions must have at least one item',
          index,
        });
      }
      
      // If items are provided, split must be true
      if (transaction.items && transaction.items.length > 0 && !transaction.split) {
        errors.push({
          field: `transactions[${index}].split`,
          message: 'Transactions with items must have split=true',
          index,
        });
      }
      
      // If split transaction, validate that items sum equals parent amount
      if (transaction.split && transaction.items && transaction.items.length > 0) {
        const itemsTotal = transaction.items.reduce((sum, item) => sum + item.amount, 0);
        if (Math.abs(itemsTotal - transaction.amount) > 0.01) {
          errors.push({
            field: `transactions[${index}].items`,
            message: `Sum of item amounts (${itemsTotal}) must equal parent amount (${transaction.amount})`,
            index,
          });
        }
      }
      
      // Split transactions should not have a category on the parent
      if (transaction.split && transaction.category) {
        errors.push({
          field: `transactions[${index}].category`,
          message: 'Split transactions should not have a category on the parent transaction',
          index,
        });
      }
    });
    
    if (errors.length > 0) {
      return {
        valid: false,
        errors,
      };
    }
    
    return {
      valid: true,
      errors: [],
      data: validated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      };
    }
    throw error;
  }
}

/**
 * Match account name to existing account ID
 * Returns the account ID if found, or undefined if not found
 */
export async function matchAccountName(
  accountName: string,
  userId: string
): Promise<string | undefined> {
  // Get all accounts for the user
  const accounts = await prisma.account.findMany({
    where: { userId },
  });
  
  // Try exact match first (case-insensitive)
  const exactMatch = accounts.find(
    account => account.name.toLowerCase() === accountName.toLowerCase()
  );
  
  if (exactMatch) {
    return exactMatch.id;
  }
  
  // Try partial match
  const partialMatch = accounts.find(
    account => account.name.toLowerCase().includes(accountName.toLowerCase())
  );
  
  if (partialMatch) {
    return partialMatch.id;
  }
  
  return undefined;
}

/**
 * Match category name to existing category ID, or create new category
 * Returns the category ID
 */
export async function matchOrCreateCategory(
  categoryName: string,
  userId: string
): Promise<string> {
  // Get all categories for the user
  const categories = await prisma.category.findMany({
    where: { userId },
  });
  
  // Try exact match first (case-insensitive)
  const exactMatch = categories.find(
    category => category.name.toLowerCase() === categoryName.toLowerCase()
  );
  
  if (exactMatch) {
    return exactMatch.id;
  }
  
  // Create new category
  const newCategory = await prisma.category.create({
    data: {
      name: categoryName,
      userId,
    },
  });
  
  return newCategory.id;
}

/**
 * Match or create tag by name
 * Returns the tag ID
 */
export async function matchOrCreateTag(
  tagName: string,
  userId: string
): Promise<string> {
  // Get all tags for the user
  const tags = await prisma.tag.findMany({
    where: { userId },
  });
  
  // Try exact match first (case-insensitive)
  const exactMatch = tags.find(
    tag => tag.name.toLowerCase() === tagName.toLowerCase()
  );
  
  if (exactMatch) {
    return exactMatch.id;
  }
  
  // Create new tag
  const newTag = await prisma.tag.create({
    data: {
      name: tagName,
      userId,
    },
  });
  
  return newTag.id;
}

/**
 * Process and preview import data
 * Matches accounts, categories, and tags to existing records
 * Returns preview data with warnings for any issues
 */
export async function processImportData(
  importData: ImportData,
  userId: string
): Promise<ImportPreview> {
  const transactions: ParsedTransaction[] = [];
  const warnings: string[] = [];
  
  for (let i = 0; i < importData.transactions.length; i++) {
    const transaction = importData.transactions[i];
    
    // Match account
    const accountId = await matchAccountName(transaction.account, userId);
    if (!accountId) {
      warnings.push(
        `Transaction ${i + 1}: Account "${transaction.account}" not found. Please create this account first.`
      );
      continue; // Skip this transaction
    }
    
    // Convert type to uppercase enum
    let type = transaction.type.toUpperCase() as 'INCOME' | 'EXPENSE' | 'TRANSFER';
    
    // Auto-detect transfers based on category name
    if (transaction.category && transaction.category.toLowerCase().includes('transfer')) {
      type = 'TRANSFER';
    }
    
    // Process regular transaction
    if (!transaction.split) {
      let categoryId: string | undefined;
      
      // Don't assign category to transfers
      if (transaction.category && type !== 'TRANSFER') {
        categoryId = await matchOrCreateCategory(transaction.category, userId);
      }
      
      // Process tags
      let tagIds: string[] | undefined;
      if (transaction.tags && transaction.tags.length > 0) {
        tagIds = await Promise.all(
          transaction.tags.map(tagName => matchOrCreateTag(tagName, userId))
        );
      }
      
      transactions.push({
        date: transaction.date,
        amount: transaction.amount,
        type,
        description: transaction.description,
        category: transaction.category,
        categoryId,
        account: transaction.account,
        accountId,
        notes: transaction.notes || undefined,
        tags: transaction.tags,
        tagIds,
      });
    } else {
      // Process split transaction
      if (!transaction.items || transaction.items.length === 0) {
        warnings.push(`Transaction ${i + 1}: Split transaction has no items`);
        continue;
      }
      
      const items = await Promise.all(
        transaction.items.map(async (item) => {
          let categoryId: string | undefined;
          
          if (item.category) {
            categoryId = await matchOrCreateCategory(item.category, userId);
          }
          
          return {
            amount: item.amount,
            description: item.description,
            category: item.category,
            categoryId,
            notes: (item.notes ?? undefined) as string | undefined,
          };
        })
      );
      
      transactions.push({
        date: transaction.date,
        amount: transaction.amount,
        type,
        description: transaction.description,
        account: transaction.account,
        accountId,
        notes: transaction.notes || undefined,
        split: true,
        items,
      });
    }
  }
  
  return {
    transactions,
    warnings,
    document: importData.document,
  };
}

/**
 * Get the import schema documentation
 */
export function getImportSchema(): object {
  return {
    version: '1.0',
    description: 'JSON/YAML import schema for Home Budget Manager',
    format: {
      version: 'string (required) - Schema version, currently "1.0"',
      source: 'string (optional) - Identifier for the parsing tool used',
      document: {
        filename: 'string (optional) - Original document filename',
        date: 'string (optional) - Document date in YYYY-MM-DD format',
      },
      transactions: [
        {
          date: 'string (required) - Transaction date in YYYY-MM-DD format',
          amount: 'number (required) - Transaction amount (positive number)',
          type: 'string (required) - "income", "expense", or "transfer"',
          description: 'string (required) - Transaction description',
          category: 'string (optional) - Category name (will be matched or created)',
          account: 'string (required) - Account name (must match existing account)',
          notes: 'string (optional) - Additional notes',
          tags: 'array of strings (optional) - Tag names',
          split: 'boolean (optional) - Set to true for multi-category transactions',
          items: [
            {
              amount: 'number (required if split=true) - Item amount',
              description: 'string (required if split=true) - Item description',
              category: 'string (optional) - Item category name',
              notes: 'string (optional) - Item notes',
            },
          ],
        },
      ],
    },
    examples: {
      json: {
        version: '1.0',
        source: 'external_ai_parser',
        document: {
          filename: 'bank_statement_jan_2024.pdf',
          date: '2024-01-31',
        },
        transactions: [
          {
            date: '2024-01-15',
            amount: 50.0,
            type: 'expense',
            description: 'Grocery Store Purchase',
            category: 'Food & Dining',
            account: 'Checking Account',
            notes: 'Weekly groceries',
          },
          {
            date: '2024-01-18',
            amount: 85.5,
            type: 'expense',
            description: 'Walmart Receipt',
            account: 'Credit Card',
            split: true,
            items: [
              {
                amount: 35.0,
                description: 'Groceries',
                category: 'Food & Dining',
              },
              {
                amount: 40.0,
                description: 'USB Cable',
                category: 'Electronics',
              },
              {
                amount: 10.5,
                description: 'Shampoo',
                category: 'Personal Care',
              },
            ],
          },
        ],
      },
    },
  };
}
