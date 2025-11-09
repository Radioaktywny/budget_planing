import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
export const AccountTypeSchema = z.enum(['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'CASH']);
export type AccountType = z.infer<typeof AccountTypeSchema>;

export const CreateAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  type: AccountTypeSchema,
  userId: z.string().uuid(),
  initialBalance: z.number().optional(),
  initialBalanceDate: z.string().datetime().optional(),
});

export const UpdateAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required').optional(),
  type: AccountTypeSchema.optional(),
  initialBalance: z.number().optional(),
  initialBalanceDate: z.string().datetime().optional(),
});

export type CreateAccountInput = z.infer<typeof CreateAccountSchema>;
export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>;

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get all accounts for a user
 */
export async function getAllAccounts(userId: string): Promise<Account[]> {
  return await prisma.account.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Get a single account by ID
 */
export async function getAccountById(accountId: string, userId: string): Promise<Account | null> {
  return await prisma.account.findFirst({
    where: {
      id: accountId,
      userId,
    },
  });
}

/**
 * Create a new account
 */
export async function createAccount(data: CreateAccountInput): Promise<Account> {
  // Validate input
  const validated = CreateAccountSchema.parse(data);

  // Check if account with same name already exists for this user
  const existing = await prisma.account.findFirst({
    where: {
      userId: validated.userId,
      name: validated.name,
    },
  });

  if (existing) {
    throw new Error('An account with this name already exists');
  }

  // Create account with initial balance
  return await prisma.account.create({
    data: {
      name: validated.name,
      type: validated.type,
      userId: validated.userId,
      balance: validated.initialBalance || 0,
      initialBalance: validated.initialBalance || 0,
      initialBalanceDate: validated.initialBalanceDate ? new Date(validated.initialBalanceDate) : null,
    },
  });
}

/**
 * Update an existing account
 */
export async function updateAccount(
  accountId: string,
  userId: string,
  data: UpdateAccountInput
): Promise<Account> {
  // Validate input
  const validated = UpdateAccountSchema.parse(data);

  // Check if account exists and belongs to user
  const account = await getAccountById(accountId, userId);
  if (!account) {
    throw new Error('Account not found');
  }

  // If updating name, check for duplicates
  if (validated.name && validated.name !== account.name) {
    const existing = await prisma.account.findFirst({
      where: {
        userId,
        name: validated.name,
        id: { not: accountId },
      },
    });

    if (existing) {
      throw new Error('An account with this name already exists');
    }
  }

  // If updating initial balance, recalculate current balance
  let newBalance = account.balance;
  if (validated.initialBalance !== undefined) {
    // Get all transactions for this account
    const transactions = await prisma.transaction.findMany({
      where: { accountId },
      select: {
        amount: true,
        type: true,
      },
    });

    // Calculate balance: initialBalance + sum of transactions
    const transactionSum = transactions.reduce((sum, t) => {
      if (t.type === 'INCOME') {
        return sum + t.amount;
      } else if (t.type === 'EXPENSE') {
        return sum - t.amount;
      }
      return sum; // TRANSFER handled separately
    }, 0);

    newBalance = validated.initialBalance + transactionSum;
  }

  // Update account with recalculated balance
  return await prisma.account.update({
    where: { id: accountId },
    data: {
      ...validated,
      balance: newBalance,
    },
  });
}

/**
 * Delete an account
 * Only allows deletion if account has no transactions
 */
export async function deleteAccount(accountId: string, userId: string): Promise<void> {
  // Check if account exists and belongs to user
  const account = await getAccountById(accountId, userId);
  if (!account) {
    throw new Error('Account not found');
  }

  // Check if account has any transactions
  const transactionCount = await prisma.transaction.count({
    where: { accountId },
  });

  if (transactionCount > 0) {
    throw new Error('Cannot delete account with existing transactions');
  }

  // Check if account is involved in any transfers
  const transferCount = await prisma.transfer.count({
    where: {
      OR: [
        { fromAccountId: accountId },
        { toAccountId: accountId },
      ],
    },
  });

  if (transferCount > 0) {
    throw new Error('Cannot delete account with existing transfers');
  }

  // Delete account
  await prisma.account.delete({
    where: { id: accountId },
  });
}

/**
 * Calculate account balance based on transactions
 * This recalculates the balance from scratch based on all transactions
 */
export async function calculateAccountBalance(accountId: string): Promise<number> {
  // Get all transactions for this account
  const transactions = await prisma.transaction.findMany({
    where: {
      accountId,
      isParent: false, // Exclude parent transactions from split transactions
    },
    include: {
      transfer: true,
    },
  });

  let balance = 0;

  for (const transaction of transactions) {
    // For transfers, we need to determine if this is a debit or credit
    if (transaction.type === 'TRANSFER' && transaction.transfer) {
      // If this account is the source (fromAccount), it's a debit (subtract)
      if (transaction.transfer.fromAccountId === accountId) {
        balance -= transaction.amount;
      }
      // If this account is the destination (toAccount), it's a credit (add)
      else if (transaction.transfer.toAccountId === accountId) {
        balance += transaction.amount;
      }
    } else if (transaction.type === 'INCOME') {
      balance += transaction.amount;
    } else if (transaction.type === 'EXPENSE') {
      balance -= transaction.amount;
    }
  }

  return balance;
}

/**
 * Get current balance for an account
 * Returns the stored balance (which should be kept in sync with transactions)
 */
export async function getAccountBalance(accountId: string, userId: string): Promise<number> {
  const account = await getAccountById(accountId, userId);
  if (!account) {
    throw new Error('Account not found');
  }
  return account.balance;
}

/**
 * Update account balance
 * This is used internally when transactions are created/updated/deleted
 */
export async function updateAccountBalance(accountId: string, newBalance: number): Promise<void> {
  await prisma.account.update({
    where: { id: accountId },
    data: { balance: newBalance },
  });
}

/**
 * Recalculate and update account balance
 * Useful for fixing balance discrepancies
 */
export async function recalculateAndUpdateBalance(accountId: string, userId: string): Promise<number> {
  // Verify account belongs to user
  const account = await getAccountById(accountId, userId);
  if (!account) {
    throw new Error('Account not found');
  }

  const calculatedBalance = await calculateAccountBalance(accountId);
  await updateAccountBalance(accountId, calculatedBalance);
  return calculatedBalance;
}
