/**
 * Starter Data Service
 * Creates default categories and tags for new users
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Default categories structure for new users
 */
const DEFAULT_CATEGORIES = [
  // Income categories
  { name: 'Salary', color: '#10b981', parentId: null },
  { name: 'Freelance', color: '#10b981', parentId: null },
  { name: 'Investments', color: '#10b981', parentId: null },
  { name: 'Other Income', color: '#10b981', parentId: null },
  
  // Expense categories - Housing
  { name: 'Housing', color: '#ef4444', parentId: null },
  { name: 'Rent/Mortgage', color: '#ef4444', parentId: 'Housing' },
  { name: 'Utilities', color: '#ef4444', parentId: 'Housing' },
  { name: 'Home Maintenance', color: '#ef4444', parentId: 'Housing' },
  
  // Expense categories - Transportation
  { name: 'Transportation', color: '#f59e0b', parentId: null },
  { name: 'Gas/Fuel', color: '#f59e0b', parentId: 'Transportation' },
  { name: 'Public Transit', color: '#f59e0b', parentId: 'Transportation' },
  { name: 'Car Maintenance', color: '#f59e0b', parentId: 'Transportation' },
  { name: 'Parking', color: '#f59e0b', parentId: 'Transportation' },
  
  // Expense categories - Food
  { name: 'Food & Dining', color: '#8b5cf6', parentId: null },
  { name: 'Groceries', color: '#8b5cf6', parentId: 'Food & Dining' },
  { name: 'Restaurants', color: '#8b5cf6', parentId: 'Food & Dining' },
  { name: 'Coffee Shops', color: '#8b5cf6', parentId: 'Food & Dining' },
  
  // Expense categories - Shopping
  { name: 'Shopping', color: '#ec4899', parentId: null },
  { name: 'Clothing', color: '#ec4899', parentId: 'Shopping' },
  { name: 'Electronics', color: '#ec4899', parentId: 'Shopping' },
  { name: 'Home Goods', color: '#ec4899', parentId: 'Shopping' },
  
  // Expense categories - Entertainment
  { name: 'Entertainment', color: '#06b6d4', parentId: null },
  { name: 'Movies & Shows', color: '#06b6d4', parentId: 'Entertainment' },
  { name: 'Hobbies', color: '#06b6d4', parentId: 'Entertainment' },
  { name: 'Sports', color: '#06b6d4', parentId: 'Entertainment' },
  
  // Expense categories - Health
  { name: 'Health & Fitness', color: '#14b8a6', parentId: null },
  { name: 'Medical', color: '#14b8a6', parentId: 'Health & Fitness' },
  { name: 'Pharmacy', color: '#14b8a6', parentId: 'Health & Fitness' },
  { name: 'Gym', color: '#14b8a6', parentId: 'Health & Fitness' },
  
  // Expense categories - Personal Care
  { name: 'Personal Care', color: '#a855f7', parentId: null },
  { name: 'Haircut', color: '#a855f7', parentId: 'Personal Care' },
  { name: 'Cosmetics', color: '#a855f7', parentId: 'Personal Care' },
  
  // Expense categories - Education
  { name: 'Education', color: '#3b82f6', parentId: null },
  { name: 'Tuition', color: '#3b82f6', parentId: 'Education' },
  { name: 'Books', color: '#3b82f6', parentId: 'Education' },
  { name: 'Courses', color: '#3b82f6', parentId: 'Education' },
  
  // Expense categories - Bills & Utilities
  { name: 'Bills & Utilities', color: '#f97316', parentId: null },
  { name: 'Phone', color: '#f97316', parentId: 'Bills & Utilities' },
  { name: 'Internet', color: '#f97316', parentId: 'Bills & Utilities' },
  { name: 'Subscriptions', color: '#f97316', parentId: 'Bills & Utilities' },
  
  // Expense categories - Insurance
  { name: 'Insurance', color: '#64748b', parentId: null },
  { name: 'Health Insurance', color: '#64748b', parentId: 'Insurance' },
  { name: 'Car Insurance', color: '#64748b', parentId: 'Insurance' },
  { name: 'Home Insurance', color: '#64748b', parentId: 'Insurance' },
  
  // Miscellaneous
  { name: 'Gifts & Donations', color: '#84cc16', parentId: null },
  { name: 'Taxes', color: '#dc2626', parentId: null },
  { name: 'Uncategorized', color: '#6b7280', parentId: null },
];

/**
 * Default tags for new users
 */
const DEFAULT_TAGS = [
  'work-related',
  'tax-deductible',
  'vacation',
  'gift',
  'emergency',
  'recurring',
  'one-time',
];

/**
 * Create default categories for a new user
 * @param userId User ID to create categories for
 */
export async function createDefaultCategories(userId: string): Promise<void> {
  try {
    console.log(`Creating default categories for user ${userId}...`);
    
    const categoryMap = new Map<string, string>();

    // First pass: create all parent categories
    for (const cat of DEFAULT_CATEGORIES) {
      if (cat.parentId === null) {
        const category = await prisma.category.create({
          data: {
            name: cat.name,
            color: cat.color,
            userId: userId,
          },
        });
        categoryMap.set(cat.name, category.id);
      }
    }

    // Second pass: create child categories
    for (const cat of DEFAULT_CATEGORIES) {
      if (cat.parentId !== null) {
        const parentId = categoryMap.get(cat.parentId);
        if (parentId) {
          const category = await prisma.category.create({
            data: {
              name: cat.name,
              color: cat.color,
              userId: userId,
              parentId: parentId,
            },
          });
          categoryMap.set(cat.name, category.id);
        }
      }
    }

    console.log(`✓ Created ${DEFAULT_CATEGORIES.length} default categories`);
  } catch (error) {
    console.error('Error creating default categories:', error);
    throw error;
  }
}

/**
 * Create default tags for a new user
 * @param userId User ID to create tags for
 */
export async function createDefaultTags(userId: string): Promise<void> {
  try {
    console.log(`Creating default tags for user ${userId}...`);
    
    for (const tagName of DEFAULT_TAGS) {
      await prisma.tag.create({
        data: {
          name: tagName,
          userId: userId,
        },
      });
    }

    console.log(`✓ Created ${DEFAULT_TAGS.length} default tags`);
  } catch (error) {
    console.error('Error creating default tags:', error);
    throw error;
  }
}

/**
 * Create complete starter data for a new user
 * Includes categories and tags
 * @param userId User ID to create starter data for
 */
export async function createStarterData(userId: string): Promise<void> {
  try {
    console.log(`Setting up starter data for user ${userId}...`);
    
    await createDefaultCategories(userId);
    await createDefaultTags(userId);
    
    console.log(`✓ Starter data setup complete for user ${userId}`);
  } catch (error) {
    console.error('Error creating starter data:', error);
    // Don't throw - we don't want to fail user registration if starter data fails
    // User can still create their own categories and tags
  }
}
