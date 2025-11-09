import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { TransactionType } from '../types/enums';
import * as accountService from './accountService';
import { aiService } from './aiService';

const prisma = new PrismaClient();

// Validation schemas
export const TransactionTypeSchema = z.enum(['INCOME', 'EXPENSE', 'TRANSFER']);

export const CreateTransactionSchema = z.object({
  date: z.string().datetime().or(z.date()),
  amount: z.number().positive('Amount must be greater than 0'),
  type: TransactionTypeSchema,
  description: z.string().min(1, 'Description is required'),
  notes: z.string().optional(),
  accountId: z.string().uuid('Invalid account ID'),
  categoryId: z.string().uuid('Invalid category ID').optional().nullable(),
  userId: z.string().uuid('Invalid user ID'),
  tagIds: z.array(z.string().uuid()).optional(),
});

export const UpdateTransactionSchema = z.object({
  date: z.string().datetime().or(z.date()).optional(),
  amount: z.number().positive('Amount must be greater than 0').optional(),
  type: TransactionTypeSchema.optional(),
  description: z.string().min(1, 'Description is required').optional(),
  notes: z.string().optional().nullable(),
  accountId: z.string().uuid('Invalid account ID').optional(),
  categoryId: z.string().uuid('Invalid category ID').optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export const CreateTransferSchema = z.object({
  date: z.string().datetime().or(z.date()),
  amount: z.number().positive('Amount must be greater than 0'),
  description: z.string().min(1, 'Description is required'),
  notes: z.string().optional(),
  fromAccountId: z.string().uuid('Invalid from account ID'),
  toAccountId: z.string().uuid('Invalid to account ID'),
  userId: z.string().uuid('Invalid user ID'),
});

export const SplitItemSchema = z.object({
  amount: z.number().positive('Item amount must be greater than 0'),
  description: z.string().min(1, 'Item description is required'),
  categoryId: z.string().uuid('Invalid category ID').optional().nullable(),
  notes: z.string().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export const CreateSplitTransactionSchema = z.object({
  date: z.string().datetime().or(z.date()),
  amount: z.number().positive('Amount must be greater than 0'),
  type: TransactionTypeSchema,
  description: z.string().min(1, 'Description is required'),
  notes: z.string().optional(),
  accountId: z.string().uuid('Invalid account ID'),
  userId: z.string().uuid('Invalid user ID'),
  items: z.array(SplitItemSchema).min(1, 'At least one split item is required'),
});

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;
export type CreateTransferInput = z.infer<typeof CreateTransferSchema>;
export type SplitItem = z.infer<typeof SplitItemSchema>;
export type CreateSplitTransactionInput = z.infer<typeof CreateSplitTransactionSchema>;

export interface Transaction {
  id: string;
  date: Date;
  amount: number;
  type: string;
  description: string;
  notes: string | null;
  accountId: string;
  categoryId: string | null;
  userId: string;
  documentId: string | null;
  isParent: boolean;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionWithRelations extends Transaction {
  account: {
    id: string;
    name: string;
    type: string;
  };
  category?: {
    id: string;
    name: string;
  } | null;
  tags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
}

/**
 * Get all transactions for a user with optional filtering
 * Returns both regular transactions and parent split transactions (with their child items)
 */
export async function getAllTransactions(
  userId: string,
  filters?: {
    accountId?: string;
    categoryId?: string;
    type?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  }
): Promise<TransactionWithRelations[]> {
  const where: any = {
    userId,
    parentId: null, // Only get top-level transactions (regular transactions and parent split transactions)
  };

  if (filters?.accountId) {
    where.accountId = filters.accountId;
  }

  if (filters?.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters?.type) {
    where.type = filters.type;
  }

  if (filters?.startDate || filters?.endDate) {
    where.date = {};
    if (filters.startDate) {
      where.date.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.date.lte = filters.endDate;
    }
  }

  if (filters?.search) {
    where.description = {
      contains: filters.search,
      mode: 'insensitive',
    };
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      account: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      transfer: {
        include: {
          fromAccount: {
            select: {
              id: true,
              name: true,
            },
          },
          toAccount: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      splitItems: {
        include: {
          account: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          tags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { date: 'desc' },
  });

  return transactions;
}

/**
 * Get a single transaction by ID
 */
export async function getTransactionById(
  transactionId: string,
  userId: string
): Promise<TransactionWithRelations | null> {
  return await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      userId,
    },
    include: {
      account: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      transfer: {
        include: {
          fromAccount: {
            select: {
              id: true,
              name: true,
            },
          },
          toAccount: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Create a new transaction
 */
export async function createTransaction(
  data: CreateTransactionInput
): Promise<TransactionWithRelations> {
  // Validate input
  const validated = CreateTransactionSchema.parse(data);

  // Verify account exists and belongs to user
  const account = await accountService.getAccountById(validated.accountId, validated.userId);
  if (!account) {
    throw new Error('Account not found');
  }

  // Auto-suggest category if not provided
  let categoryId = validated.categoryId;
  if (!categoryId && validated.type !== 'TRANSFER') {
    try {
      const suggestion = await aiService.suggestCategory(
        validated.description,
        validated.amount
      );
      
      if (suggestion.success && suggestion.suggestion) {
        // Try to find matching category by name
        const matchedCategory = await prisma.category.findFirst({
          where: {
            name: suggestion.suggestion.category,
            userId: validated.userId,
          },
        });
        
        if (matchedCategory) {
          categoryId = matchedCategory.id;
        }
      }
    } catch (error) {
      // Silently fail - categorization is optional
      console.log('Auto-categorization failed, continuing without category:', error);
    }
  }

  // Verify category exists and belongs to user if provided
  if (categoryId) {
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId: validated.userId,
      },
    });
    if (!category) {
      throw new Error('Category not found');
    }
  }

  // Convert date to Date object if it's a string
  const transactionDate = typeof validated.date === 'string' 
    ? new Date(validated.date) 
    : validated.date;

  // Create transaction
  const transaction = await prisma.transaction.create({
    data: {
      date: transactionDate,
      amount: validated.amount,
      type: validated.type,
      description: validated.description,
      notes: validated.notes,
      accountId: validated.accountId,
      categoryId: categoryId,
      userId: validated.userId,
      isParent: false,
    },
    include: {
      account: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      transfer: {
        include: {
          fromAccount: {
            select: {
              id: true,
              name: true,
            },
          },
          toAccount: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  // Handle tags if provided
  if (validated.tagIds && validated.tagIds.length > 0) {
    await prisma.transactionTag.createMany({
      data: validated.tagIds.map(tagId => ({
        transactionId: transaction.id,
        tagId,
      })),
    });

    // Refetch transaction with tags
    const updatedTransaction = await getTransactionById(transaction.id, validated.userId);
    if (!updatedTransaction) {
      throw new Error('Failed to fetch created transaction');
    }

    // Update account balance
    await updateAccountBalanceAfterTransaction(
      validated.accountId,
      validated.type,
      validated.amount,
      'create'
    );

    return updatedTransaction;
  }

  // Update account balance
  await updateAccountBalanceAfterTransaction(
    validated.accountId,
    validated.type,
    validated.amount,
    'create'
  );

  return transaction;
}

/**
 * Update an existing transaction
 */
export async function updateTransaction(
  transactionId: string,
  userId: string,
  data: UpdateTransactionInput
): Promise<TransactionWithRelations> {
  // Validate input
  const validated = UpdateTransactionSchema.parse(data);

  // Get existing transaction
  const existingTransaction = await getTransactionById(transactionId, userId);
  if (!existingTransaction) {
    throw new Error('Transaction not found');
  }

  // Verify new account exists and belongs to user if changing account
  if (validated.accountId && validated.accountId !== existingTransaction.accountId) {
    const account = await accountService.getAccountById(validated.accountId, userId);
    if (!account) {
      throw new Error('Account not found');
    }
  }

  // Verify category exists and belongs to user if provided
  if (validated.categoryId) {
    const category = await prisma.category.findFirst({
      where: {
        id: validated.categoryId,
        userId,
      },
    });
    if (!category) {
      throw new Error('Category not found');
    }
  }

  // Convert date to Date object if it's a string
  const transactionDate = validated.date 
    ? (typeof validated.date === 'string' ? new Date(validated.date) : validated.date)
    : undefined;

  // Prepare update data
  const updateData: any = {
    ...(transactionDate && { date: transactionDate }),
    ...(validated.amount !== undefined && { amount: validated.amount }),
    ...(validated.type && { type: validated.type }),
    ...(validated.description && { description: validated.description }),
    ...(validated.notes !== undefined && { notes: validated.notes }),
    ...(validated.accountId && { accountId: validated.accountId }),
    ...(validated.categoryId !== undefined && { categoryId: validated.categoryId }),
  };

  // Update transaction
  await prisma.transaction.update({
    where: { id: transactionId },
    data: updateData,
    include: {
      account: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      transfer: {
        include: {
          fromAccount: {
            select: {
              id: true,
              name: true,
            },
          },
          toAccount: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  // Handle tags if provided
  if (validated.tagIds !== undefined) {
    // Remove existing tags
    await prisma.transactionTag.deleteMany({
      where: { transactionId },
    });

    // Add new tags
    if (validated.tagIds.length > 0) {
      await prisma.transactionTag.createMany({
        data: validated.tagIds.map(tagId => ({
          transactionId,
          tagId,
        })),
      });
    }
  }

  // Recalculate balances for affected accounts
  const accountsToUpdate = new Set<string>();
  accountsToUpdate.add(existingTransaction.accountId);
  if (validated.accountId && validated.accountId !== existingTransaction.accountId) {
    accountsToUpdate.add(validated.accountId);
  }

  for (const accountId of accountsToUpdate) {
    await accountService.recalculateAndUpdateBalance(accountId, userId);
  }

  // Refetch transaction with updated tags
  const updatedTransaction = await getTransactionById(transactionId, userId);
  if (!updatedTransaction) {
    throw new Error('Failed to fetch updated transaction');
  }

  return updatedTransaction;
}

/**
 * Delete a transaction
 * If the transaction is a parent, all child transactions are also deleted (cascade)
 */
export async function deleteTransaction(transactionId: string, userId: string): Promise<void> {
  // Get existing transaction
  const transaction = await getTransactionById(transactionId, userId);
  if (!transaction) {
    throw new Error('Transaction not found');
  }

  // If this is a parent transaction, delete all child transactions first
  if (transaction.isParent) {
    const childTransactions = await prisma.transaction.findMany({
      where: {
        parentId: transactionId,
        userId,
      },
    });

    // Delete tags for all child transactions
    for (const child of childTransactions) {
      await prisma.transactionTag.deleteMany({
        where: { transactionId: child.id },
      });
    }

    // Delete all child transactions
    await prisma.transaction.deleteMany({
      where: {
        parentId: transactionId,
        userId,
      },
    });
  }

  // Delete associated tags for the main transaction
  await prisma.transactionTag.deleteMany({
    where: { transactionId },
  });

  // Handle transfer transactions specially
  if (transaction.type === TransactionType.TRANSFER) {
    // Check if this transaction is the "from" side of a transfer
    const transfer = await prisma.transfer.findUnique({
      where: { transactionId },
    });

    // Delete transfer record first
    await prisma.transfer.deleteMany({
      where: { transactionId },
    });

    // Delete transaction
    await prisma.transaction.delete({
      where: { id: transactionId },
    });

    // Update balance based on whether this is from or to account
    const account = await prisma.account.findUnique({
      where: { id: transaction.accountId },
    });
    
    if (account) {
      if (transfer) {
        // This is the "from" transaction, so we need to add the amount back
        await accountService.updateAccountBalance(
          transaction.accountId,
          account.balance + transaction.amount
        );
      } else {
        // This is the "to" transaction, so we need to subtract the amount
        await accountService.updateAccountBalance(
          transaction.accountId,
          account.balance - transaction.amount
        );
      }
    }
  } else {
    // Delete transaction
    await prisma.transaction.delete({
      where: { id: transactionId },
    });

    // For non-transfer transactions, use the standard balance update
    await updateAccountBalanceAfterTransaction(
      transaction.accountId,
      transaction.type,
      transaction.amount,
      'delete'
    );
  }
}

/**
 * Helper function to update account balance after transaction operations
 */
async function updateAccountBalanceAfterTransaction(
  accountId: string,
  transactionType: string,
  amount: number,
  operation: 'create' | 'delete'
): Promise<void> {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
  });

  if (!account) {
    throw new Error('Account not found');
  }

  let balanceChange = 0;

  if (operation === 'create') {
    if (transactionType === TransactionType.INCOME) {
      balanceChange = amount;
    } else if (transactionType === TransactionType.EXPENSE) {
      balanceChange = -amount;
    }
  } else if (operation === 'delete') {
    // Reverse the operation
    if (transactionType === TransactionType.INCOME) {
      balanceChange = -amount;
    } else if (transactionType === TransactionType.EXPENSE) {
      balanceChange = amount;
    }
  }

  const newBalance = account.balance + balanceChange;
  await accountService.updateAccountBalance(accountId, newBalance);
}

/**
 * Create a transfer between two accounts
 * This creates two linked transactions: a debit from the source account and a credit to the destination account
 */
export async function createTransfer(
  data: CreateTransferInput
): Promise<{ fromTransaction: TransactionWithRelations; toTransaction: TransactionWithRelations }> {
  // Validate input
  const validated = CreateTransferSchema.parse(data);

  // Validate that from and to accounts are different
  if (validated.fromAccountId === validated.toAccountId) {
    throw new Error('Cannot transfer to the same account');
  }

  // Verify both accounts exist and belong to user
  const fromAccount = await accountService.getAccountById(validated.fromAccountId, validated.userId);
  if (!fromAccount) {
    throw new Error('Source account not found');
  }

  const toAccount = await accountService.getAccountById(validated.toAccountId, validated.userId);
  if (!toAccount) {
    throw new Error('Destination account not found');
  }

  // Convert date to Date object if it's a string
  const transferDate = typeof validated.date === 'string' 
    ? new Date(validated.date) 
    : validated.date;

  // Create both transactions and transfer record in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the "from" transaction (debit)
    const fromTransaction = await tx.transaction.create({
      data: {
        date: transferDate,
        amount: validated.amount,
        type: TransactionType.TRANSFER,
        description: validated.description,
        notes: validated.notes,
        accountId: validated.fromAccountId,
        userId: validated.userId,
        isParent: false,
      },
    });

    // Create the "to" transaction (credit)
    const toTransaction = await tx.transaction.create({
      data: {
        date: transferDate,
        amount: validated.amount,
        type: TransactionType.TRANSFER,
        description: validated.description,
        notes: validated.notes,
        accountId: validated.toAccountId,
        userId: validated.userId,
        isParent: false,
      },
    });

    // Create transfer record linking both transactions
    // We'll use the fromTransaction as the primary transaction
    await tx.transfer.create({
      data: {
        transactionId: fromTransaction.id,
        fromAccountId: validated.fromAccountId,
        toAccountId: validated.toAccountId,
      },
    });

    // Update balances for both accounts
    // From account: subtract amount
    const newFromBalance = fromAccount.balance - validated.amount;
    await tx.account.update({
      where: { id: validated.fromAccountId },
      data: { balance: newFromBalance },
    });

    // To account: add amount
    const newToBalance = toAccount.balance + validated.amount;
    await tx.account.update({
      where: { id: validated.toAccountId },
      data: { balance: newToBalance },
    });

    return { fromTransaction, toTransaction };
  });

  // Fetch the complete transactions with relations
  const fromTransactionWithRelations = await getTransactionById(result.fromTransaction.id, validated.userId);
  const toTransactionWithRelations = await getTransactionById(result.toTransaction.id, validated.userId);

  if (!fromTransactionWithRelations || !toTransactionWithRelations) {
    throw new Error('Failed to fetch created transfer transactions');
  }

  return {
    fromTransaction: fromTransactionWithRelations,
    toTransaction: toTransactionWithRelations,
  };
}

/**
 * Create a split transaction with multiple child items
 * This creates a parent transaction and multiple child transactions with different categories
 */
export async function createSplitTransaction(
  data: CreateSplitTransactionInput
): Promise<{ parent: TransactionWithRelations; items: TransactionWithRelations[] }> {
  // Validate input
  const validated = CreateSplitTransactionSchema.parse(data);

  // Validate that child amounts sum to parent amount
  const itemsTotal = validated.items.reduce((sum, item) => sum + item.amount, 0);
  if (Math.abs(itemsTotal - validated.amount) > 0.01) {
    throw new Error(
      `Sum of item amounts (${itemsTotal}) must equal parent amount (${validated.amount})`
    );
  }

  // Verify account exists and belongs to user
  const account = await accountService.getAccountById(validated.accountId, validated.userId);
  if (!account) {
    throw new Error('Account not found');
  }

  // Verify all categories exist and belong to user
  for (const item of validated.items) {
    if (item.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: item.categoryId,
          userId: validated.userId,
        },
      });
      if (!category) {
        throw new Error(`Category not found: ${item.categoryId}`);
      }
    }
  }

  // Convert date to Date object if it's a string
  const transactionDate = typeof validated.date === 'string' 
    ? new Date(validated.date) 
    : validated.date;

  // Create parent and child transactions in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create parent transaction
    const parent = await tx.transaction.create({
      data: {
        date: transactionDate,
        amount: validated.amount,
        type: validated.type,
        description: validated.description,
        notes: validated.notes,
        accountId: validated.accountId,
        userId: validated.userId,
        isParent: true,
        categoryId: null, // Parent has no category
      },
    });

    // Create child transactions
    const childTransactions = [];
    for (const item of validated.items) {
      const child = await tx.transaction.create({
        data: {
          date: transactionDate,
          amount: item.amount,
          type: validated.type,
          description: item.description,
          notes: item.notes,
          accountId: validated.accountId,
          categoryId: item.categoryId,
          userId: validated.userId,
          isParent: false,
          parentId: parent.id,
        },
      });

      // Handle tags for child item if provided
      if (item.tagIds && item.tagIds.length > 0) {
        await tx.transactionTag.createMany({
          data: item.tagIds.map(tagId => ({
            transactionId: child.id,
            tagId,
          })),
        });
      }

      childTransactions.push(child);
    }

    return { parent, childTransactions };
  });

  // Update account balance based on parent transaction
  await updateAccountBalanceAfterTransaction(
    validated.accountId,
    validated.type,
    validated.amount,
    'create'
  );

  // Fetch complete transactions with relations
  const parentWithRelations = await getTransactionById(result.parent.id, validated.userId);
  if (!parentWithRelations) {
    throw new Error('Failed to fetch created parent transaction');
  }

  const itemsWithRelations = await Promise.all(
    result.childTransactions.map(child => getTransactionById(child.id, validated.userId))
  );

  // Filter out any null values (shouldn't happen, but TypeScript safety)
  const validItems = itemsWithRelations.filter(
    (item): item is TransactionWithRelations => item !== null
  );

  return {
    parent: parentWithRelations,
    items: validItems,
  };
}

/**
 * Get all child items for a parent split transaction
 */
export async function getSplitTransactionItems(
  parentId: string,
  userId: string
): Promise<TransactionWithRelations[]> {
  // Verify parent transaction exists and belongs to user
  const parent = await getTransactionById(parentId, userId);
  if (!parent) {
    throw new Error('Parent transaction not found');
  }

  if (!parent.isParent) {
    throw new Error('Transaction is not a parent transaction');
  }

  // Get all child transactions
  return await prisma.transaction.findMany({
    where: {
      parentId,
      userId,
    },
    include: {
      account: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      transfer: {
        include: {
          fromAccount: {
            select: {
              id: true,
              name: true,
            },
          },
          toAccount: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}
