// Enums
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

// Models
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  description: string;
  notes?: string;
  accountId: string;
  categoryId?: string;
  userId: string;
  documentId?: string;
  isParent: boolean;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  account?: Account;
  category?: Category;
  tags?: Tag[];
  transfer?: Transfer;
  splitItems?: Transaction[];
}

export interface Transfer {
  id: string;
  transactionId: string;
  fromAccountId: string;
  toAccountId: string;
  createdAt: string;
  fromAccount?: Account;
  toAccount?: Account;
}

export interface Category {
  id: string;
  name: string;
  parentId?: string;
  userId: string;
  color?: string;
  parent?: Category;
  children?: Category[];
}

export interface Tag {
  id: string;
  name: string;
  userId: string;
  usageCount?: number;
}

export interface Document {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedAt: string;
}

// API Request/Response types
export interface CreateAccountRequest {
  name: string;
  type: AccountType;
}

export interface UpdateAccountRequest {
  name?: string;
  type?: AccountType;
}

export interface CreateTransactionRequest {
  date: string;
  amount: number;
  type: TransactionType;
  description: string;
  notes?: string;
  accountId: string;
  categoryId?: string;
  tagIds?: string[];
}

export interface CreateSplitTransactionRequest {
  date: string;
  amount: number;
  description: string;
  accountId: string;
  items: {
    amount: number;
    description: string;
    categoryId?: string;
    notes?: string;
  }[];
}

export interface CreateTransferRequest {
  date: string;
  amount: number;
  description: string;
  fromAccountId: string;
  toAccountId: string;
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  accountId?: string;
  categoryId?: string;
  tagIds?: string[];
  search?: string;
  type?: TransactionType;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalAmount: number;
}

export interface CreateCategoryRequest {
  name: string;
  parentId?: string;
  color?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  parentId?: string;
  color?: string;
}

export interface DeleteCategoryRequest {
  reassignToCategoryId?: string;
}

export interface CreateTagRequest {
  name: string;
}

export interface ReportSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  startDate: string;
  endDate: string;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  color?: string;
}

export interface NetBalancePoint {
  date: string;
  balance: number;
  income: number;
  expenses: number;
}

export interface ImportTransaction {
  date: string;
  amount: number;
  type: string;
  description: string;
  category?: string;
  account: string;
  notes?: string;
  tags?: string[];
  split?: boolean;
  items?: {
    amount: number;
    description: string;
    category?: string;
    notes?: string;
  }[];
}

export interface ImportRequest {
  version: string;
  source?: string;
  document?: {
    filename: string;
    date: string;
  };
  transactions: ImportTransaction[];
}

export interface ParsedTransaction {
  date: string;
  amount: number;
  description: string;
  category?: string;
  confidence?: number;
}

export interface CategorySuggestion {
  categoryId: string;
  categoryName: string;
  confidence: number;
}

// Error response
export interface ApiError {
  code: string;
  message: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}
