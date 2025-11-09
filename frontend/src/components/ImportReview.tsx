import React, { useState, useEffect } from 'react';
import { Category, Account, TransactionType } from '../types';
import { categoryService } from '../services/categoryService';
import { accountService } from '../services/accountService';
import { formatCurrency } from '../utils/formatters';

export interface ImportReviewTransaction {
  id: string; // Temporary ID for tracking
  date: string;
  amount: number;
  type: TransactionType;
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
    id: string; // Temporary ID for tracking
    amount: number;
    description: string;
    category?: string;
    categoryId?: string;
    notes?: string;
  }>;
  selected: boolean;
  expanded?: boolean;
}

interface ImportReviewProps {
  transactions: ImportReviewTransaction[];
  warnings?: string[];
  onApprove: (transactions: ImportReviewTransaction[]) => void;
  onCancel: () => void;
  loading?: boolean;
}

const ImportReview: React.FC<ImportReviewProps> = ({
  transactions: initialTransactions,
  warnings = [],
  onApprove,
  onCancel,
  loading = false,
}) => {
  const [transactions, setTransactions] = useState<ImportReviewTransaction[]>(initialTransactions);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [allSelected, setAllSelected] = useState(true);

  useEffect(() => {
    loadCategories();
    loadAccounts();
  }, []);

  useEffect(() => {
    // Add temporary IDs and set all as selected by default
    const transactionsWithIds = initialTransactions.map((t, index) => ({
      ...t,
      id: t.id || `temp-${index}`,
      selected: true,
      expanded: false,
      items: t.items?.map((item, itemIndex) => ({
        ...item,
        id: item.id || `temp-${index}-item-${itemIndex}`,
      })),
    }));
    setTransactions(transactionsWithIds);
  }, [initialTransactions]);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadAccounts = async () => {
    try {
      const data = await accountService.getAll();
      setAccounts(data);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  };

  const handleSelectAll = () => {
    const newValue = !allSelected;
    setAllSelected(newValue);
    setTransactions(transactions.map(t => ({ ...t, selected: newValue })));
  };

  const handleSelectTransaction = (id: string) => {
    setTransactions(transactions.map(t =>
      t.id === id ? { ...t, selected: !t.selected } : t
    ));
    // Update allSelected state
    const updatedTransactions = transactions.map(t =>
      t.id === id ? { ...t, selected: !t.selected } : t
    );
    setAllSelected(updatedTransactions.every(t => t.selected));
  };

  const handleUpdateTransaction = (id: string, field: string, value: any) => {
    setTransactions(transactions.map(t =>
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const handleUpdateItem = (transactionId: string, itemId: string, field: string, value: any) => {
    setTransactions(transactions.map(t => {
      if (t.id === transactionId && t.items) {
        return {
          ...t,
          items: t.items.map(item =>
            item.id === itemId ? { ...item, [field]: value } : item
          ),
        };
      }
      return t;
    }));
  };

  const handleToggleExpand = (id: string) => {
    setTransactions(transactions.map(t =>
      t.id === id ? { ...t, expanded: !t.expanded } : t
    ));
  };

  const handleConvertToSplit = (id: string) => {
    setTransactions(transactions.map(t => {
      if (t.id === id) {
        // Convert to split transaction with one initial item
        return {
          ...t,
          split: true,
          categoryId: undefined,
          category: undefined,
          items: [
            {
              id: `${id}-item-0`,
              amount: t.amount,
              description: t.description,
              categoryId: t.categoryId,
              category: t.category,
              notes: t.notes,
            },
          ],
          expanded: true,
        };
      }
      return t;
    }));
  };

  const handleConvertToRegular = (id: string) => {
    setTransactions(transactions.map(t => {
      if (t.id === id && t.items && t.items.length > 0) {
        // Convert back to regular transaction using first item
        const firstItem = t.items[0];
        return {
          ...t,
          split: false,
          categoryId: firstItem.categoryId,
          category: firstItem.category,
          notes: firstItem.notes,
          items: undefined,
          expanded: false,
        };
      }
      return t;
    }));
  };

  const handleAddItem = (transactionId: string) => {
    setTransactions(transactions.map(t => {
      if (t.id === transactionId && t.items) {
        const newItem = {
          id: `${transactionId}-item-${t.items.length}`,
          amount: 0,
          description: '',
          categoryId: undefined,
          category: undefined,
          notes: undefined,
        };
        return {
          ...t,
          items: [...t.items, newItem],
        };
      }
      return t;
    }));
  };

  const handleRemoveItem = (transactionId: string, itemId: string) => {
    setTransactions(transactions.map(t => {
      if (t.id === transactionId && t.items) {
        const updatedItems = t.items.filter(item => item.id !== itemId);
        // If only one item left, convert back to regular transaction
        if (updatedItems.length === 1) {
          const lastItem = updatedItems[0];
          return {
            ...t,
            split: false,
            categoryId: lastItem.categoryId,
            category: lastItem.category,
            notes: lastItem.notes,
            items: undefined,
            expanded: false,
          };
        }
        return {
          ...t,
          items: updatedItems,
        };
      }
      return t;
    }));
  };

  const validateSplitTransaction = (transaction: ImportReviewTransaction): string | null => {
    if (!transaction.split || !transaction.items) return null;
    
    const itemsTotal = transaction.items.reduce((sum, item) => sum + item.amount, 0);
    const diff = Math.abs(itemsTotal - transaction.amount);
    
    if (diff > 0.01) {
      return `Items total ($${itemsTotal.toFixed(2)}) must equal transaction amount ($${transaction.amount.toFixed(2)})`;
    }
    
    return null;
  };

  const handleApproveAll = () => {
    // Validate split transactions
    const invalidSplits = transactions.filter(t => {
      if (t.split) {
        const error = validateSplitTransaction(t);
        return error !== null;
      }
      return false;
    });

    if (invalidSplits.length > 0) {
      alert('Please fix split transaction validation errors before approving');
      return;
    }

    onApprove(transactions.filter(t => t.selected));
  };

  const handleApproveSelected = () => {
    const selected = transactions.filter(t => t.selected);
    if (selected.length === 0) {
      alert('Please select at least one transaction to approve');
      return;
    }

    // Validate split transactions
    const invalidSplits = selected.filter(t => {
      if (t.split) {
        const error = validateSplitTransaction(t);
        return error !== null;
      }
      return false;
    });

    if (invalidSplits.length > 0) {
      alert('Please fix split transaction validation errors before approving');
      return;
    }

    onApprove(selected);
  };

  const selectedCount = transactions.filter(t => t.selected).length;
  const totalAmount = transactions
    .filter(t => t.selected)
    .reduce((sum, t) => sum + (t.type === 'EXPENSE' ? -t.amount : t.amount), 0);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Review Transactions</h2>
        <button
          onClick={onCancel}
          className="text-sm text-gray-600 hover:text-gray-800"
          disabled={loading}
        >
          Cancel
        </button>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-yellow-500 mt-0.5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">Warnings</h3>
              <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-800">
              <span className="font-semibold">{selectedCount}</span> of{' '}
              <span className="font-semibold">{transactions.length}</span> transactions selected
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Net amount: <span className={`font-semibold ${totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(totalAmount).toFixed(2)} {totalAmount >= 0 ? '(income)' : '(expense)'}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleApproveSelected}
              disabled={loading || selectedCount === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Approving...' : `Approve Selected (${selectedCount})`}
            </button>
            <button
              onClick={handleApproveAll}
              disabled={loading || transactions.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Approving...' : 'Approve All'}
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <React.Fragment key={transaction.id}>
                <tr className={transaction.selected ? '' : 'opacity-50'}>
                  <td className="px-3 py-4">
                    <input
                      type="checkbox"
                      checked={transaction.selected}
                      onChange={() => handleSelectTransaction(transaction.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 py-4">
                    <input
                      type="date"
                      value={transaction.date}
                      onChange={(e) => handleUpdateTransaction(transaction.id, 'date', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      disabled={!transaction.selected}
                    />
                  </td>
                  <td className="px-3 py-4">
                    <input
                      type="text"
                      value={transaction.description}
                      onChange={(e) => handleUpdateTransaction(transaction.id, 'description', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      disabled={!transaction.selected}
                      placeholder="Description"
                    />
                  </td>
                  <td className="px-3 py-4">
                    <select
                      value={transaction.accountId || ''}
                      onChange={(e) => {
                        const accountId = e.target.value;
                        const account = accounts.find(a => a.id === accountId);
                        handleUpdateTransaction(transaction.id, 'accountId', accountId);
                        if (account) {
                          handleUpdateTransaction(transaction.id, 'account', account.name);
                        }
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      disabled={!transaction.selected}
                    >
                      <option value="">Select account</option>
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-4">
                    {!transaction.split ? (
                      <select
                        value={transaction.categoryId || ''}
                        onChange={(e) => {
                          const categoryId = e.target.value;
                          const category = categories.find(c => c.id === categoryId);
                          handleUpdateTransaction(transaction.id, 'categoryId', categoryId);
                          if (category) {
                            handleUpdateTransaction(transaction.id, 'category', category.name);
                          }
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        disabled={!transaction.selected}
                      >
                        <option value="">Select category</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm text-gray-500 italic">Split Transaction</span>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${transaction.type === 'EXPENSE' ? 'text-red-600' : 'text-green-600'}`}>
                        {transaction.type === 'EXPENSE' ? '-' : '+'}${transaction.amount.toFixed(2)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-col gap-1">
                      {transaction.split && transaction.items && transaction.items.length > 0 ? (
                        <>
                          <button
                            onClick={() => handleToggleExpand(transaction.id)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                            disabled={!transaction.selected}
                          >
                            {transaction.expanded ? 'Hide' : 'Show'} Items ({transaction.items.length})
                          </button>
                          <button
                            onClick={() => handleConvertToRegular(transaction.id)}
                            className="text-xs text-gray-600 hover:text-gray-800"
                            disabled={!transaction.selected}
                          >
                            Convert to Regular
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleConvertToSplit(transaction.id)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                          disabled={!transaction.selected}
                        >
                          Split Transaction
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                
                {/* Split Items */}
                {transaction.split && transaction.expanded && transaction.items && (
                  <>
                    {transaction.items.map((item, itemIndex) => (
                      <tr key={item.id} className="bg-gray-50">
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2">
                          <span className="text-xs text-gray-500">Item {itemIndex + 1}</span>
                        </td>
                        <td className="px-3 py-2 pl-8">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleUpdateItem(transaction.id, item.id, 'description', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            disabled={!transaction.selected}
                            placeholder="Item description"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-xs text-gray-500">Same as parent</span>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={item.categoryId || ''}
                            onChange={(e) => {
                              const categoryId = e.target.value;
                              const category = categories.find(c => c.id === categoryId);
                              handleUpdateItem(transaction.id, item.id, 'categoryId', categoryId);
                              if (category) {
                                handleUpdateItem(transaction.id, item.id, 'category', category.name);
                              }
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            disabled={!transaction.selected}
                          >
                            <option value="">Select category</option>
                            {categories.map(category => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.01"
                            value={item.amount}
                            onChange={(e) => handleUpdateItem(transaction.id, item.id, 'amount', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            disabled={!transaction.selected}
                          />
                        </td>
                        <td className="px-3 py-2">
                          {transaction.items && transaction.items.length > 1 && (
                            <button
                              onClick={() => handleRemoveItem(transaction.id, item.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                              disabled={!transaction.selected}
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {/* Add Item Button and Validation */}
                    <tr className="bg-gray-50">
                      <td className="px-3 py-2"></td>
                      <td colSpan={5} className="px-3 py-2">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => handleAddItem(transaction.id)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                            disabled={!transaction.selected}
                          >
                            + Add Item
                          </button>
                          {(() => {
                            const validationError = validateSplitTransaction(transaction);
                            if (validationError) {
                              return (
                                <span className="text-xs text-red-600">
                                  {validationError}
                                </span>
                              );
                            }
                            const itemsTotal = transaction.items?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            return (
                              <span className="text-xs text-gray-600">
                                Items total: ${itemsTotal.toFixed(2)} / ${transaction.amount.toFixed(2)}
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-3 py-2"></td>
                    </tr>
                  </>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {transactions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No transactions to review
        </div>
      )}
    </div>
  );
};

export default ImportReview;
