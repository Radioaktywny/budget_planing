import { PrismaClient } from '@prisma/client';
import * as importService from '../importService';

const prisma = new PrismaClient();

// Test user ID
let testUserId: string;
let testAccountId: string;

beforeAll(async () => {
  // Find or create a test user
  let testUser = await prisma.user.findUnique({
    where: { email: 'test@importservice.test' },
  });

  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: 'test@importservice.test',
        name: 'Test User',
      },
    });
  }
  
  testUserId = testUser.id;
  
  // Create a test account
  const testAccount = await prisma.account.create({
    data: {
      name: 'Test Checking Account',
      type: 'CHECKING',
      balance: 1000,
      userId: testUserId,
    },
  });
  
  testAccountId = testAccount.id;
});

afterAll(async () => {
  // Clean up test data
  if (testUserId) {
    const accounts = await prisma.account.findMany({ where: { userId: testUserId } });
    const accountIds = accounts.map(a => a.id);
    
    if (accountIds.length > 0) {
      await prisma.transfer.deleteMany({
        where: {
          OR: [
            { fromAccountId: { in: accountIds } },
            { toAccountId: { in: accountIds } },
          ],
        },
      });
    }
    
    await prisma.transactionTag.deleteMany({
      where: { transaction: { userId: testUserId } },
    });
    await prisma.transaction.deleteMany({ where: { userId: testUserId } });
    await prisma.account.deleteMany({ where: { userId: testUserId } });
    await prisma.category.deleteMany({ where: { userId: testUserId } });
    await prisma.tag.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
  }
  
  await prisma.$disconnect();
});

describe('ImportService - JSON Parsing', () => {
  test('should parse valid JSON data', () => {
    const jsonData = JSON.stringify({
      version: '1.0',
      transactions: [
        {
          date: '2024-01-15',
          amount: 50.0,
          type: 'expense',
          description: 'Test Transaction',
          account: 'Test Checking Account',
        },
      ],
    });
    
    const result = importService.parseJSON(jsonData);
    
    expect(result.valid).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.transactions).toHaveLength(1);
  });
  
  test('should reject invalid JSON format', () => {
    const invalidJson = '{ invalid json }';
    
    const result = importService.parseJSON(invalidJson);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('json');
  });
  
  test('should reject JSON with missing required fields', () => {
    const jsonData = JSON.stringify({
      version: '1.0',
      transactions: [
        {
          date: '2024-01-15',
          // Missing amount
          type: 'expense',
          description: 'Test Transaction',
          account: 'Test Checking Account',
        },
      ],
    });
    
    const result = importService.parseJSON(jsonData);
    
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
  
  test('should reject JSON with invalid date format', () => {
    const jsonData = JSON.stringify({
      version: '1.0',
      transactions: [
        {
          date: '01/15/2024', // Invalid format
          amount: 50.0,
          type: 'expense',
          description: 'Test Transaction',
          account: 'Test Checking Account',
        },
      ],
    });
    
    const result = importService.parseJSON(jsonData);
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field.includes('date'))).toBe(true);
  });
  
  test('should reject JSON with invalid transaction type', () => {
    const jsonData = JSON.stringify({
      version: '1.0',
      transactions: [
        {
          date: '2024-01-15',
          amount: 50.0,
          type: 'invalid_type',
          description: 'Test Transaction',
          account: 'Test Checking Account',
        },
      ],
    });
    
    const result = importService.parseJSON(jsonData);
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field.includes('type'))).toBe(true);
  });
});

describe('ImportService - YAML Parsing', () => {
  test('should parse valid YAML data', () => {
    const yamlData = `
version: "1.0"
transactions:
  - date: "2024-01-15"
    amount: 50.0
    type: "expense"
    description: "Test Transaction"
    account: "Test Checking Account"
`;
    
    const result = importService.parseYAML(yamlData);
    
    expect(result.valid).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.transactions).toHaveLength(1);
  });
  
  test('should reject invalid YAML format', () => {
    const invalidYaml = `
version: "1.0"
transactions:
  - date: "2024-01-15"
    amount: 50.0
    type: "expense"
  description: "Invalid indentation"
`;
    
    const result = importService.parseYAML(invalidYaml);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('yaml');
  });
});

describe('ImportService - Split Transaction Validation', () => {
  test('should validate split transaction with correct item sum', () => {
    const jsonData = JSON.stringify({
      version: '1.0',
      transactions: [
        {
          date: '2024-01-15',
          amount: 100.0,
          type: 'expense',
          description: 'Split Transaction',
          account: 'Test Checking Account',
          split: true,
          items: [
            { amount: 60.0, description: 'Item 1', category: 'Food' },
            { amount: 40.0, description: 'Item 2', category: 'Transport' },
          ],
        },
      ],
    });
    
    const result = importService.parseJSON(jsonData);
    
    expect(result.valid).toBe(true);
  });
  
  test('should reject split transaction with incorrect item sum', () => {
    const jsonData = JSON.stringify({
      version: '1.0',
      transactions: [
        {
          date: '2024-01-15',
          amount: 100.0,
          type: 'expense',
          description: 'Split Transaction',
          account: 'Test Checking Account',
          split: true,
          items: [
            { amount: 60.0, description: 'Item 1', category: 'Food' },
            { amount: 30.0, description: 'Item 2', category: 'Transport' },
          ],
        },
      ],
    });
    
    const result = importService.parseJSON(jsonData);
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('must equal parent amount'))).toBe(true);
  });
  
  test('should reject split transaction without items', () => {
    const jsonData = JSON.stringify({
      version: '1.0',
      transactions: [
        {
          date: '2024-01-15',
          amount: 100.0,
          type: 'expense',
          description: 'Split Transaction',
          account: 'Test Checking Account',
          split: true,
        },
      ],
    });
    
    const result = importService.parseJSON(jsonData);
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('must have at least one item'))).toBe(true);
  });
  
  test('should reject split transaction with category on parent', () => {
    const jsonData = JSON.stringify({
      version: '1.0',
      transactions: [
        {
          date: '2024-01-15',
          amount: 100.0,
          type: 'expense',
          description: 'Split Transaction',
          category: 'Food', // Should not have category
          account: 'Test Checking Account',
          split: true,
          items: [
            { amount: 60.0, description: 'Item 1', category: 'Food' },
            { amount: 40.0, description: 'Item 2', category: 'Transport' },
          ],
        },
      ],
    });
    
    const result = importService.parseJSON(jsonData);
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('should not have a category'))).toBe(true);
  });
});

describe('ImportService - Account Name Matching', () => {
  test('should match account by exact name', async () => {
    const accountId = await importService.matchAccountName('Test Checking Account', testUserId);
    
    expect(accountId).toBe(testAccountId);
  });
  
  test('should match account by case-insensitive name', async () => {
    const accountId = await importService.matchAccountName('test checking account', testUserId);
    
    expect(accountId).toBe(testAccountId);
  });
  
  test('should match account by partial name', async () => {
    const accountId = await importService.matchAccountName('Checking', testUserId);
    
    expect(accountId).toBe(testAccountId);
  });
  
  test('should return undefined for non-existent account', async () => {
    const accountId = await importService.matchAccountName('Non-Existent Account', testUserId);
    
    expect(accountId).toBeUndefined();
  });
});

describe('ImportService - Category Matching and Creation', () => {
  test('should match existing category by name', async () => {
    // Create a test category
    const category = await prisma.category.create({
      data: {
        name: 'Test Food Category',
        userId: testUserId,
      },
    });
    
    const categoryId = await importService.matchOrCreateCategory('Test Food Category', testUserId);
    
    expect(categoryId).toBe(category.id);
  });
  
  test('should create new category if not found', async () => {
    const categoryId = await importService.matchOrCreateCategory('New Test Category', testUserId);
    
    expect(categoryId).toBeDefined();
    
    // Verify category was created
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    
    expect(category).toBeDefined();
    expect(category?.name).toBe('New Test Category');
  });
  
  test('should match category case-insensitively', async () => {
    const category = await prisma.category.create({
      data: {
        name: 'Transport Category',
        userId: testUserId,
      },
    });
    
    const categoryId = await importService.matchOrCreateCategory('transport category', testUserId);
    
    expect(categoryId).toBe(category.id);
  });
});

describe('ImportService - Tag Matching and Creation', () => {
  test('should match existing tag by name', async () => {
    // Create a test tag
    const tag = await prisma.tag.create({
      data: {
        name: 'test-tag',
        userId: testUserId,
      },
    });
    
    const tagId = await importService.matchOrCreateTag('test-tag', testUserId);
    
    expect(tagId).toBe(tag.id);
  });
  
  test('should create new tag if not found', async () => {
    const tagId = await importService.matchOrCreateTag('new-test-tag', testUserId);
    
    expect(tagId).toBeDefined();
    
    // Verify tag was created
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
    });
    
    expect(tag).toBeDefined();
    expect(tag?.name).toBe('new-test-tag');
  });
});

describe('ImportService - Process Import Data', () => {
  test('should process valid import data with account matching', async () => {
    const importData: importService.ImportData = {
      version: '1.0',
      transactions: [
        {
          date: '2024-01-15',
          amount: 50.0,
          type: 'expense',
          description: 'Test Transaction',
          category: 'Food',
          account: 'Test Checking Account',
        },
      ],
    };
    
    const preview = await importService.processImportData(importData, testUserId);
    
    expect(preview.transactions).toHaveLength(1);
    expect(preview.transactions[0].accountId).toBe(testAccountId);
    expect(preview.transactions[0].categoryId).toBeDefined();
    expect(preview.warnings).toHaveLength(0);
  });
  
  test('should add warning for non-existent account', async () => {
    const importData: importService.ImportData = {
      version: '1.0',
      transactions: [
        {
          date: '2024-01-15',
          amount: 50.0,
          type: 'expense',
          description: 'Test Transaction',
          account: 'Non-Existent Account',
        },
      ],
    };
    
    const preview = await importService.processImportData(importData, testUserId);
    
    expect(preview.transactions).toHaveLength(0);
    expect(preview.warnings.length).toBeGreaterThan(0);
    expect(preview.warnings[0]).toContain('Account "Non-Existent Account" not found');
  });
  
  test('should process split transaction with items', async () => {
    const importData: importService.ImportData = {
      version: '1.0',
      transactions: [
        {
          date: '2024-01-15',
          amount: 100.0,
          type: 'expense',
          description: 'Split Transaction',
          account: 'Test Checking Account',
          split: true,
          items: [
            { amount: 60.0, description: 'Item 1', category: 'Food' },
            { amount: 40.0, description: 'Item 2', category: 'Transport' },
          ],
        },
      ],
    };
    
    const preview = await importService.processImportData(importData, testUserId);
    
    expect(preview.transactions).toHaveLength(1);
    expect(preview.transactions[0].split).toBe(true);
    expect(preview.transactions[0].items).toHaveLength(2);
    expect(preview.transactions[0].items?.[0].categoryId).toBeDefined();
    expect(preview.transactions[0].items?.[1].categoryId).toBeDefined();
  });
  
  test('should process transaction with tags', async () => {
    const importData: importService.ImportData = {
      version: '1.0',
      transactions: [
        {
          date: '2024-01-15',
          amount: 50.0,
          type: 'expense',
          description: 'Test Transaction',
          account: 'Test Checking Account',
          tags: ['tag1', 'tag2'],
        },
      ],
    };
    
    const preview = await importService.processImportData(importData, testUserId);
    
    expect(preview.transactions).toHaveLength(1);
    expect(preview.transactions[0].tagIds).toHaveLength(2);
  });
});

describe('ImportService - Get Schema', () => {
  test('should return import schema documentation', () => {
    const schema = importService.getImportSchema();
    
    expect(schema).toBeDefined();
    expect(schema).toHaveProperty('version');
    expect(schema).toHaveProperty('description');
    expect(schema).toHaveProperty('format');
    expect(schema).toHaveProperty('examples');
  });
});
