import { PrismaClient } from '@prisma/client';
import * as categoryService from '../categoryService';

const prisma = new PrismaClient();

// Test user ID
let testUserId: string;

beforeAll(async () => {
  // Find or create a test user
  let testUser = await prisma.user.findUnique({
    where: { email: 'test@categoryservice.test' },
  });

  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: 'test@categoryservice.test',
        name: 'Test User',
      },
    });
  }
  
  testUserId = testUser.id;
});

afterAll(async () => {
  // Clean up test data
  if (testUserId) {
    // Delete in correct order due to foreign keys
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
    
    await prisma.transaction.deleteMany({ where: { userId: testUserId } });
    await prisma.account.deleteMany({ where: { userId: testUserId } });
    await prisma.category.deleteMany({ where: { userId: testUserId } });
    await prisma.tag.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
  }
  await prisma.$disconnect();
});

afterEach(async () => {
  // Clean up after each test
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
  
  await prisma.transaction.deleteMany({ where: { userId: testUserId } });
  await prisma.account.deleteMany({ where: { userId: testUserId } });
  await prisma.category.deleteMany({ where: { userId: testUserId } });
});

describe('Category Service', () => {
  describe('createCategory', () => {
    it('should create a category with valid data', async () => {
      const categoryData = {
        name: 'Food & Dining',
        userId: testUserId,
      };

      const category = await categoryService.createCategory(categoryData);

      expect(category).toBeDefined();
      expect(category.id).toBeDefined();
      expect(category.name).toBe('Food & Dining');
      expect(category.userId).toBe(testUserId);
      expect(category.parentId).toBeNull();
    });

    it('should create a category with parent', async () => {
      const parent = await categoryService.createCategory({
        name: 'Shopping',
        userId: testUserId,
      });

      const child = await categoryService.createCategory({
        name: 'Groceries',
        parentId: parent.id,
        userId: testUserId,
      });

      expect(child.parentId).toBe(parent.id);
      expect(child.parent?.name).toBe('Shopping');
    });

    it('should create a category with color', async () => {
      const category = await categoryService.createCategory({
        name: 'Entertainment',
        color: '#FF5733',
        userId: testUserId,
      });

      expect(category.color).toBe('#FF5733');
    });

    it('should throw error when creating category with empty name', async () => {
      const categoryData = {
        name: '',
        userId: testUserId,
      };

      await expect(categoryService.createCategory(categoryData)).rejects.toThrow();
    });

    it('should throw error when creating category with duplicate name', async () => {
      const categoryData = {
        name: 'Duplicate Category',
        userId: testUserId,
      };

      await categoryService.createCategory(categoryData);

      await expect(categoryService.createCategory(categoryData)).rejects.toThrow(
        'A category with this name already exists'
      );
    });

    it('should throw error when parent category does not exist', async () => {
      // Create a valid UUID that doesn't exist
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      const categoryData = {
        name: 'Child Category',
        parentId: nonExistentId,
        userId: testUserId,
      };

      await expect(categoryService.createCategory(categoryData)).rejects.toThrow(
        'Parent category not found'
      );
    });

    it('should allow same category name for different users', async () => {
      const anotherUser = await prisma.user.create({
        data: {
          email: 'another@categoryservice.test',
          name: 'Another User',
        },
      });

      const category1 = await categoryService.createCategory({
        name: 'Shared Name',
        userId: testUserId,
      });

      const category2 = await categoryService.createCategory({
        name: 'Shared Name',
        userId: anotherUser.id,
      });

      expect(category1.name).toBe('Shared Name');
      expect(category2.name).toBe('Shared Name');
      expect(category1.userId).not.toBe(category2.userId);

      // Clean up
      await prisma.category.delete({ where: { id: category2.id } });
      await prisma.user.delete({ where: { id: anotherUser.id } });
    });
  });

  describe('updateCategory', () => {
    it('should update category name', async () => {
      const category = await categoryService.createCategory({
        name: 'Original Name',
        userId: testUserId,
      });

      const updated = await categoryService.updateCategory(category.id, testUserId, {
        name: 'Updated Name',
      });

      expect(updated.name).toBe('Updated Name');
    });

    it('should update category parent', async () => {
      const parent = await categoryService.createCategory({
        name: 'Parent',
        userId: testUserId,
      });

      const category = await categoryService.createCategory({
        name: 'Child',
        userId: testUserId,
      });

      const updated = await categoryService.updateCategory(category.id, testUserId, {
        parentId: parent.id,
      });

      expect(updated.parentId).toBe(parent.id);
    });

    it('should update category color', async () => {
      const category = await categoryService.createCategory({
        name: 'Test Category',
        userId: testUserId,
      });

      const updated = await categoryService.updateCategory(category.id, testUserId, {
        color: '#00FF00',
      });

      expect(updated.color).toBe('#00FF00');
    });

    it('should remove parent by setting parentId to null', async () => {
      const parent = await categoryService.createCategory({
        name: 'Parent',
        userId: testUserId,
      });

      const category = await categoryService.createCategory({
        name: 'Child',
        parentId: parent.id,
        userId: testUserId,
      });

      const updated = await categoryService.updateCategory(category.id, testUserId, {
        parentId: null,
      });

      expect(updated.parentId).toBeNull();
    });

    it('should throw error when updating to duplicate name', async () => {
      await categoryService.createCategory({
        name: 'Category 1',
        userId: testUserId,
      });

      const category2 = await categoryService.createCategory({
        name: 'Category 2',
        userId: testUserId,
      });

      await expect(
        categoryService.updateCategory(category2.id, testUserId, { name: 'Category 1' })
      ).rejects.toThrow('A category with this name already exists');
    });

    it('should throw error when category not found', async () => {
      await expect(
        categoryService.updateCategory('non-existent-id', testUserId, { name: 'New Name' })
      ).rejects.toThrow('Category not found');
    });

    it('should throw error when setting category as its own parent', async () => {
      const category = await categoryService.createCategory({
        name: 'Test Category',
        userId: testUserId,
      });

      await expect(
        categoryService.updateCategory(category.id, testUserId, { parentId: category.id })
      ).rejects.toThrow('Category cannot be its own parent');
    });

    it('should throw error when creating circular reference', async () => {
      const parent = await categoryService.createCategory({
        name: 'Parent',
        userId: testUserId,
      });

      const child = await categoryService.createCategory({
        name: 'Child',
        parentId: parent.id,
        userId: testUserId,
      });

      // Try to set parent's parent to child (circular reference)
      await expect(
        categoryService.updateCategory(parent.id, testUserId, { parentId: child.id })
      ).rejects.toThrow('Cannot set parent to a descendant category');
    });

    it('should throw error when parent category not found', async () => {
      const category = await categoryService.createCategory({
        name: 'Test Category',
        userId: testUserId,
      });

      // Create a valid UUID that doesn't exist
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await expect(
        categoryService.updateCategory(category.id, testUserId, { parentId: nonExistentId })
      ).rejects.toThrow('Parent category not found');
    });
  });

  describe('deleteCategory', () => {
    it('should delete category without transactions', async () => {
      const category = await categoryService.createCategory({
        name: 'To Delete',
        userId: testUserId,
      });

      await categoryService.deleteCategory(category.id, testUserId);

      const deleted = await categoryService.getCategoryById(category.id, testUserId);
      expect(deleted).toBeNull();
    });

    it('should throw error when deleting category with transactions without reassignment', async () => {
      const account = await prisma.account.create({
        data: {
          name: 'Test Account',
          type: 'CHECKING',
          userId: testUserId,
        },
      });

      const category = await categoryService.createCategory({
        name: 'With Transactions',
        userId: testUserId,
      });

      await prisma.transaction.create({
        data: {
          date: new Date(),
          amount: 100,
          type: 'EXPENSE',
          description: 'Test transaction',
          accountId: account.id,
          categoryId: category.id,
          userId: testUserId,
        },
      });

      await expect(
        categoryService.deleteCategory(category.id, testUserId)
      ).rejects.toThrow('Cannot delete category with transactions');

      // Note: cleanup handled by afterEach
    });

    it('should delete category and reassign transactions', async () => {
      const account = await prisma.account.create({
        data: {
          name: 'Test Account',
          type: 'CHECKING',
          userId: testUserId,
        },
      });

      const oldCategory = await categoryService.createCategory({
        name: 'Old Category',
        userId: testUserId,
      });

      const newCategory = await categoryService.createCategory({
        name: 'New Category',
        userId: testUserId,
      });

      const transaction = await prisma.transaction.create({
        data: {
          date: new Date(),
          amount: 100,
          type: 'EXPENSE',
          description: 'Test transaction',
          accountId: account.id,
          categoryId: oldCategory.id,
          userId: testUserId,
        },
      });

      await categoryService.deleteCategory(oldCategory.id, testUserId, newCategory.id);

      const updatedTransaction = await prisma.transaction.findUnique({
        where: { id: transaction.id },
      });

      expect(updatedTransaction?.categoryId).toBe(newCategory.id);

      // Note: cleanup handled by afterEach
    });

    it('should throw error when reassignment category not found', async () => {
      const account = await prisma.account.create({
        data: {
          name: 'Test Account',
          type: 'CHECKING',
          userId: testUserId,
        },
      });

      const category = await categoryService.createCategory({
        name: 'Category',
        userId: testUserId,
      });

      await prisma.transaction.create({
        data: {
          date: new Date(),
          amount: 100,
          type: 'EXPENSE',
          description: 'Test transaction',
          accountId: account.id,
          categoryId: category.id,
          userId: testUserId,
        },
      });

      // Create a valid UUID that doesn't exist
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await expect(
        categoryService.deleteCategory(category.id, testUserId, nonExistentId)
      ).rejects.toThrow('Reassignment category not found');

      // Note: cleanup handled by afterEach
    });

    it('should throw error when reassigning to same category', async () => {
      const account = await prisma.account.create({
        data: {
          name: 'Test Account',
          type: 'CHECKING',
          userId: testUserId,
        },
      });

      const category = await categoryService.createCategory({
        name: 'Category',
        userId: testUserId,
      });

      await prisma.transaction.create({
        data: {
          date: new Date(),
          amount: 100,
          type: 'EXPENSE',
          description: 'Test transaction',
          accountId: account.id,
          categoryId: category.id,
          userId: testUserId,
        },
      });

      await expect(
        categoryService.deleteCategory(category.id, testUserId, category.id)
      ).rejects.toThrow('Cannot reassign transactions to the category being deleted');

      // Note: cleanup handled by afterEach
    });

    it('should move children to parent when deleting category with children', async () => {
      const grandparent = await categoryService.createCategory({
        name: 'Grandparent',
        userId: testUserId,
      });

      const parent = await categoryService.createCategory({
        name: 'Parent',
        parentId: grandparent.id,
        userId: testUserId,
      });

      const child = await categoryService.createCategory({
        name: 'Child',
        parentId: parent.id,
        userId: testUserId,
      });

      await categoryService.deleteCategory(parent.id, testUserId);

      const updatedChild = await categoryService.getCategoryById(child.id, testUserId);
      expect(updatedChild?.parentId).toBe(grandparent.id);
    });

    it('should make children root categories when deleting root category', async () => {
      const parent = await categoryService.createCategory({
        name: 'Parent',
        userId: testUserId,
      });

      const child = await categoryService.createCategory({
        name: 'Child',
        parentId: parent.id,
        userId: testUserId,
      });

      await categoryService.deleteCategory(parent.id, testUserId);

      const updatedChild = await categoryService.getCategoryById(child.id, testUserId);
      expect(updatedChild?.parentId).toBeNull();
    });

    it('should throw error when category not found', async () => {
      await expect(
        categoryService.deleteCategory('non-existent-id', testUserId)
      ).rejects.toThrow('Category not found');
    });
  });

  describe('getAllCategories', () => {
    it('should return all categories for a user', async () => {
      await categoryService.createCategory({
        name: 'Category 1',
        userId: testUserId,
      });

      await categoryService.createCategory({
        name: 'Category 2',
        userId: testUserId,
      });

      const categories = await categoryService.getAllCategories(testUserId);
      expect(categories).toHaveLength(2);
    });

    it('should return empty array when user has no categories', async () => {
      const categories = await categoryService.getAllCategories(testUserId);
      expect(categories).toHaveLength(0);
    });

    it('should include parent and children relationships', async () => {
      const parent = await categoryService.createCategory({
        name: 'Parent',
        userId: testUserId,
      });

      await categoryService.createCategory({
        name: 'Child',
        parentId: parent.id,
        userId: testUserId,
      });

      const categories = await categoryService.getAllCategories(testUserId);
      const parentCategory = categories.find(c => c.name === 'Parent');
      
      expect(parentCategory?.children).toHaveLength(1);
      expect(parentCategory?.children?.[0].name).toBe('Child');
    });
  });

  describe('getCategoryById', () => {
    it('should return category when it exists', async () => {
      const created = await categoryService.createCategory({
        name: 'Test Category',
        userId: testUserId,
      });

      const category = await categoryService.getCategoryById(created.id, testUserId);
      expect(category).toBeDefined();
      expect(category?.id).toBe(created.id);
      expect(category?.name).toBe('Test Category');
    });

    it('should return null when category does not exist', async () => {
      const category = await categoryService.getCategoryById('non-existent-id', testUserId);
      expect(category).toBeNull();
    });

    it('should return null when category belongs to different user', async () => {
      const anotherUser = await prisma.user.create({
        data: {
          email: 'getbyid@categoryservice.test',
          name: 'GetById User',
        },
      });

      const category = await categoryService.createCategory({
        name: 'Other User Category',
        userId: anotherUser.id,
      });

      const result = await categoryService.getCategoryById(category.id, testUserId);
      expect(result).toBeNull();

      // Clean up
      await prisma.category.delete({ where: { id: category.id } });
      await prisma.user.delete({ where: { id: anotherUser.id } });
    });
  });

  describe('getCategoryHierarchy', () => {
    it('should return categories in tree structure', async () => {
      const parent = await categoryService.createCategory({
        name: 'Parent',
        userId: testUserId,
      });

      await categoryService.createCategory({
        name: 'Child 1',
        parentId: parent.id,
        userId: testUserId,
      });

      await categoryService.createCategory({
        name: 'Child 2',
        parentId: parent.id,
        userId: testUserId,
      });

      const hierarchy = await categoryService.getCategoryHierarchy(testUserId);
      
      expect(hierarchy).toHaveLength(1);
      expect(hierarchy[0].name).toBe('Parent');
      expect(hierarchy[0].children).toHaveLength(2);
    });

    it('should handle multiple root categories', async () => {
      await categoryService.createCategory({
        name: 'Root 1',
        userId: testUserId,
      });

      await categoryService.createCategory({
        name: 'Root 2',
        userId: testUserId,
      });

      const hierarchy = await categoryService.getCategoryHierarchy(testUserId);
      expect(hierarchy).toHaveLength(2);
    });

    it('should handle nested hierarchy', async () => {
      const grandparent = await categoryService.createCategory({
        name: 'Grandparent',
        userId: testUserId,
      });

      const parent = await categoryService.createCategory({
        name: 'Parent',
        parentId: grandparent.id,
        userId: testUserId,
      });

      await categoryService.createCategory({
        name: 'Child',
        parentId: parent.id,
        userId: testUserId,
      });

      const hierarchy = await categoryService.getCategoryHierarchy(testUserId);
      
      expect(hierarchy).toHaveLength(1);
      expect(hierarchy[0].name).toBe('Grandparent');
      expect(hierarchy[0].children).toHaveLength(1);
      expect(hierarchy[0].children?.[0].name).toBe('Parent');
      expect(hierarchy[0].children?.[0].children).toHaveLength(1);
      expect(hierarchy[0].children?.[0].children?.[0].name).toBe('Child');
    });

    it('should return empty array when user has no categories', async () => {
      const hierarchy = await categoryService.getCategoryHierarchy(testUserId);
      expect(hierarchy).toHaveLength(0);
    });
  });
});
