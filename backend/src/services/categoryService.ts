import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  parentId: z.string().uuid().optional().nullable(),
  userId: z.string().uuid(),
  color: z.string().optional().nullable(),
});

export const UpdateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').optional(),
  parentId: z.string().uuid().optional().nullable(),
  color: z.string().optional().nullable(),
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  userId: string;
  color: string | null;
  children?: Category[];
  parent?: Category | null;
}

/**
 * Get all categories for a user
 * Returns categories in a flat list
 */
export async function getAllCategories(userId: string): Promise<Category[]> {
  return await prisma.category.findMany({
    where: { userId },
    include: {
      parent: true,
      children: true,
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Get a single category by ID
 */
export async function getCategoryById(categoryId: string, userId: string): Promise<Category | null> {
  return await prisma.category.findFirst({
    where: {
      id: categoryId,
      userId,
    },
    include: {
      parent: true,
      children: true,
    },
  });
}

/**
 * Create a new category
 */
export async function createCategory(data: CreateCategoryInput): Promise<Category> {
  // Validate input
  const validated = CreateCategorySchema.parse(data);

  // Check if category with same name already exists for this user
  const existing = await prisma.category.findFirst({
    where: {
      userId: validated.userId,
      name: validated.name,
    },
  });

  if (existing) {
    throw new Error('A category with this name already exists');
  }

  // If parentId is provided, validate that parent exists and belongs to user
  if (validated.parentId) {
    const parent = await getCategoryById(validated.parentId, validated.userId);
    if (!parent) {
      throw new Error('Parent category not found');
    }
  }

  // Create category
  return await prisma.category.create({
    data: {
      name: validated.name,
      parentId: validated.parentId || null,
      userId: validated.userId,
      color: validated.color || null,
    },
    include: {
      parent: true,
      children: true,
    },
  });
}

/**
 * Update an existing category
 */
export async function updateCategory(
  categoryId: string,
  userId: string,
  data: UpdateCategoryInput
): Promise<Category> {
  // Validate input
  const validated = UpdateCategorySchema.parse(data);

  // Check if category exists and belongs to user
  const category = await getCategoryById(categoryId, userId);
  if (!category) {
    throw new Error('Category not found');
  }

  // If updating name, check for duplicates
  if (validated.name && validated.name !== category.name) {
    const existing = await prisma.category.findFirst({
      where: {
        userId,
        name: validated.name,
        id: { not: categoryId },
      },
    });

    if (existing) {
      throw new Error('A category with this name already exists');
    }
  }

  // If updating parentId, validate the new parent
  if (validated.parentId !== undefined) {
    if (validated.parentId) {
      // Check if parent exists and belongs to user
      const parent = await getCategoryById(validated.parentId, userId);
      if (!parent) {
        throw new Error('Parent category not found');
      }

      // Prevent circular reference: category cannot be its own parent
      if (validated.parentId === categoryId) {
        throw new Error('Category cannot be its own parent');
      }

      // Prevent circular reference: category cannot be a child of its own descendant
      const isDescendant = await isCategoryDescendant(validated.parentId, categoryId);
      if (isDescendant) {
        throw new Error('Cannot set parent to a descendant category');
      }
    }
  }

  // Update category
  return await prisma.category.update({
    where: { id: categoryId },
    data: {
      ...(validated.name && { name: validated.name }),
      ...(validated.parentId !== undefined && { parentId: validated.parentId }),
      ...(validated.color !== undefined && { color: validated.color }),
    },
    include: {
      parent: true,
      children: true,
    },
  });
}

/**
 * Delete a category
 * Requires reassignment of transactions to another category if transactions exist
 */
export async function deleteCategory(
  categoryId: string,
  userId: string,
  reassignToCategoryId?: string
): Promise<void> {
  // Check if category exists and belongs to user
  const category = await getCategoryById(categoryId, userId);
  if (!category) {
    throw new Error('Category not found');
  }

  // Check if category has any transactions
  const transactionCount = await prisma.transaction.count({
    where: { categoryId },
  });

  if (transactionCount > 0) {
    // If there are transactions, reassignment is required
    if (!reassignToCategoryId) {
      throw new Error('Cannot delete category with transactions. Please provide a category to reassign transactions to.');
    }

    // Validate reassignment category exists and belongs to user
    const reassignCategory = await getCategoryById(reassignToCategoryId, userId);
    if (!reassignCategory) {
      throw new Error('Reassignment category not found');
    }

    // Cannot reassign to the same category being deleted
    if (reassignToCategoryId === categoryId) {
      throw new Error('Cannot reassign transactions to the category being deleted');
    }

    // Reassign all transactions to the new category
    await prisma.transaction.updateMany({
      where: { categoryId },
      data: { categoryId: reassignToCategoryId },
    });
  }

  // Check if category has children
  const childrenCount = await prisma.category.count({
    where: { parentId: categoryId },
  });

  if (childrenCount > 0) {
    // Move children to the parent of the category being deleted (or make them root categories)
    await prisma.category.updateMany({
      where: { parentId: categoryId },
      data: { parentId: category.parentId },
    });
  }

  // Delete category
  await prisma.category.delete({
    where: { id: categoryId },
  });
}

/**
 * Helper function to check if a category is a descendant of another category
 * Used to prevent circular references in the hierarchy
 */
async function isCategoryDescendant(potentialDescendantId: string, ancestorId: string): Promise<boolean> {
  const descendant = await prisma.category.findUnique({
    where: { id: potentialDescendantId },
    include: { parent: true },
  });

  if (!descendant) {
    return false;
  }

  // If no parent, it's a root category and cannot be a descendant
  if (!descendant.parentId) {
    return false;
  }

  // If the parent is the ancestor we're looking for, it's a descendant
  if (descendant.parentId === ancestorId) {
    return true;
  }

  // Recursively check the parent
  return await isCategoryDescendant(descendant.parentId, ancestorId);
}

/**
 * Get category hierarchy for a user
 * Returns categories organized in a tree structure
 */
export async function getCategoryHierarchy(userId: string): Promise<Category[]> {
  // Get all categories
  const allCategories = await getAllCategories(userId);

  // Build a map for quick lookup
  const categoryMap = new Map<string, Category>();
  allCategories.forEach(cat => {
    categoryMap.set(cat.id, { ...cat, children: [] });
  });

  // Build the tree structure
  const rootCategories: Category[] = [];
  
  categoryMap.forEach(category => {
    if (category.parentId) {
      const parent = categoryMap.get(category.parentId);
      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(category);
      }
    } else {
      rootCategories.push(category);
    }
  });

  return rootCategories;
}
