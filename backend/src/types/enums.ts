// Enums for type safety in the application
// Note: These correspond to string values stored in SQLite database

export enum AccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
  CREDIT_CARD = 'CREDIT_CARD',
  CASH = 'CASH',
}

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
}

// Helper functions for validation
export function isValidAccountType(type: string): type is AccountType {
  return Object.values(AccountType).includes(type as AccountType);
}

export function isValidTransactionType(type: string): type is TransactionType {
  return Object.values(TransactionType).includes(type as TransactionType);
}
