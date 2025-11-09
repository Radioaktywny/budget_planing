import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
export const CreateTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required'),
  userId: z.string().uuid(),
});

export type CreateTagInput = z.infer<typeof CreateTagSchema>;

export interface Tag {
  id: string;
  name: string;
  userId: string;
}

export interface TagWithUsageCount extends Tag {
  usageCount: number;
}

/**
 * Get all tags for a user with usage counts
 */
export async function getAllTags(userId: string): Promise<TagWithUsageCount[]> {
  const tags = await prisma.tag.findMany({
    where: { userId },
    include: {
      transactions: true,
    },
    orderBy: { name: 'asc' },
  });

  return tags.map(tag => ({
    id: tag.id,
    name: tag.name,
    userId: tag.userId,
    usageCount: tag.transactions.length,
  }));
}

/**
 * Get a single tag by ID
 */
export async function getTagById(tagId: string, userId: string): Promise<Tag | null> {
  return await prisma.tag.findFirst({
    where: {
      id: tagId,
      userId,
    },
  });
}

/**
 * Create a new tag
 */
export async function createTag(data: CreateTagInput): Promise<Tag> {
  // Validate input
  const validated = CreateTagSchema.parse(data);

  // Check if tag with same name already exists for this user
  const existing = await prisma.tag.findFirst({
    where: {
      userId: validated.userId,
      name: validated.name,
    },
  });

  if (existing) {
    throw new Error('A tag with this name already exists');
  }

  // Create tag
  return await prisma.tag.create({
    data: {
      name: validated.name,
      userId: validated.userId,
    },
  });
}

/**
 * Delete a tag
 * This will also remove all tag associations with transactions
 */
export async function deleteTag(tagId: string, userId: string): Promise<void> {
  // Check if tag exists and belongs to user
  const tag = await getTagById(tagId, userId);
  if (!tag) {
    throw new Error('Tag not found');
  }

  // Delete all transaction-tag associations first
  await prisma.transactionTag.deleteMany({
    where: { tagId },
  });

  // Delete tag
  await prisma.tag.delete({
    where: { id: tagId },
  });
}

/**
 * Associate a tag with a transaction
 */
export async function addTagToTransaction(
  transactionId: string,
  tagId: string,
  userId: string
): Promise<void> {
  // Verify tag belongs to user
  const tag = await getTagById(tagId, userId);
  if (!tag) {
    throw new Error('Tag not found');
  }

  // Verify transaction belongs to user
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      userId,
    },
  });

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  // Check if association already exists
  const existing = await prisma.transactionTag.findUnique({
    where: {
      transactionId_tagId: {
        transactionId,
        tagId,
      },
    },
  });

  if (existing) {
    // Already associated, no need to create again
    return;
  }

  // Create association
  await prisma.transactionTag.create({
    data: {
      transactionId,
      tagId,
    },
  });
}

/**
 * Remove a tag from a transaction
 */
export async function removeTagFromTransaction(
  transactionId: string,
  tagId: string,
  userId: string
): Promise<void> {
  // Verify tag belongs to user
  const tag = await getTagById(tagId, userId);
  if (!tag) {
    throw new Error('Tag not found');
  }

  // Verify transaction belongs to user
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      userId,
    },
  });

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  // Delete association if it exists
  await prisma.transactionTag.deleteMany({
    where: {
      transactionId,
      tagId,
    },
  });
}

/**
 * Get all tags for a specific transaction
 */
export async function getTagsForTransaction(
  transactionId: string,
  userId: string
): Promise<Tag[]> {
  // Verify transaction belongs to user
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      userId,
    },
  });

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  const transactionTags = await prisma.transactionTag.findMany({
    where: { transactionId },
    include: {
      tag: true,
    },
  });

  return transactionTags.map(tt => tt.tag);
}

/**
 * Set tags for a transaction (replaces all existing tags)
 */
export async function setTransactionTags(
  transactionId: string,
  tagIds: string[],
  userId: string
): Promise<void> {
  // Verify transaction belongs to user
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      userId,
    },
  });

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  // Verify all tags belong to user
  if (tagIds.length > 0) {
    const tags = await prisma.tag.findMany({
      where: {
        id: { in: tagIds },
        userId,
      },
    });

    if (tags.length !== tagIds.length) {
      throw new Error('One or more tags not found');
    }
  }

  // Remove all existing tag associations
  await prisma.transactionTag.deleteMany({
    where: { transactionId },
  });

  // Create new associations
  if (tagIds.length > 0) {
    await prisma.transactionTag.createMany({
      data: tagIds.map(tagId => ({
        transactionId,
        tagId,
      })),
    });
  }
}

/**
 * Get usage count for a specific tag
 */
export async function getTagUsageCount(tagId: string, userId: string): Promise<number> {
  // Verify tag belongs to user
  const tag = await getTagById(tagId, userId);
  if (!tag) {
    throw new Error('Tag not found');
  }

  return await prisma.transactionTag.count({
    where: { tagId },
  });
}
