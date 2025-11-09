import React, { useState, useEffect } from 'react';
import { transactionService } from '../services/transactionService';
import {
  Transaction,
  TransactionFilters,
  TransactionListResponse,
  TransactionType,
} from '../types';
import TransactionTable from '../components/TransactionTable';
import TransactionFiltersComponent from '../components/TransactionFilters';
import TransactionForm from '../components/TransactionForm';
import SplitTransactionForm from '../components/SplitTransactionForm';
import TransferForm from '../components/TransferForm';

type FormMode = 'none' | 'transaction' | 'split' | 'transfer';

const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  
  // Form state
  const [formMode, setFormMode] = useState<FormMode>('none');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  // Filter and pagination state
  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    limit: 20,
    sortBy: 'date',
    sortOrder: 'desc',
  });

  // Load transactions
  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: TransactionListResponse = await transactionService.getAll(filters);
      setTransactions(response.transactions);
      setTotalCount(response.total);
      setTotalAmount(response.totalAmount);
    } catch (err: any) {
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  // Load transactions when filters change
  useEffect(() => {
    loadTransactions();
  }, [filters]);

  // Handle filter changes
  const handleFiltersChange = (newFilters: TransactionFilters) => {
    setFilters({
      ...newFilters,
      page: 1, // Reset to first page when filters change
    });
  };

  // Handle sort
  const handleSort = (column: string) => {
    setFilters({
      ...filters,
      sortBy: column,
      sortOrder: filters.sortBy === column && filters.sortOrder === 'asc' ? 'desc' : 'asc',
    });
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setFilters({
      ...filters,
      page: newPage,
    });
  };

  // Handle edit transaction
  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    if (transaction.isParent) {
      setFormMode('split');
    } else if (transaction.type === TransactionType.TRANSFER) {
      setFormMode('transfer');
    } else {
      setFormMode('transaction');
    }
  };

  // Handle delete transaction
  const handleDelete = (transaction: Transaction) => {
    setDeletingTransaction(transaction);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!deletingTransaction) return;

    try {
      await transactionService.delete(deletingTransaction.id);
      setDeletingTransaction(null);
      await loadTransactions();
    } catch (err: any) {
      setError(err.message || 'Failed to delete transaction');
    }
  };

  // Handle transaction form submit
  const handleTransactionSubmit = async (data: any) => {
    if (editingTransaction) {
      await transactionService.update(editingTransaction.id, data);
    } else {
      await transactionService.create(data);
    }
    setFormMode('none');
    setEditingTransaction(null);
    await loadTransactions();
  };

  // Handle split transaction form submit
  const handleSplitSubmit = async (data: any) => {
    await transactionService.createSplit(data);
    setFormMode('none');
    setEditingTransaction(null);
    await loadTransactions();
  };

  // Handle transfer form submit
  const handleTransferSubmit = async (data: any) => {
    await transactionService.createTransfer(data);
    setFormMode('none');
    setEditingTransaction(null);
    await loadTransactions();
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setFormMode('none');
    setEditingTransaction(null);
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / (filters.limit || 20));

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Transactions</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setFormMode('transaction')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
          >
            <span className="sm:hidden">+ Transaction</span>
            <span className="hidden sm:inline">+ Add Transaction</span>
          </button>
          <button
            onClick={() => setFormMode('split')}
            className="bg-purple-500 hover:bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
          >
            <span className="sm:hidden">+ Split</span>
            <span className="hidden sm:inline">+ Split Transaction</span>
          </button>
          <button
            onClick={() => setFormMode('transfer')}
            className="bg-green-500 hover:bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
          >
            + Transfer
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filters */}
      <TransactionFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
        totalAmount={totalAmount}
        totalCount={totalCount}
      />

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading transactions...</div>
        </div>
      ) : (
        <>
          {/* Transaction Table */}
          <TransactionTable
            transactions={transactions}
            onEdit={handleEdit}
            onDelete={handleDelete}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onSort={handleSort}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center items-center gap-2">
              <button
                onClick={() => handlePageChange((filters.page || 1) - 1)}
                disabled={filters.page === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if ((filters.page || 1) <= 4) {
                    pageNum = i + 1;
                  } else if ((filters.page || 1) >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = (filters.page || 1) - 3 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 border rounded-lg ${
                        filters.page === pageNum
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange((filters.page || 1) + 1)}
                disabled={filters.page === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Transaction Form Modal */}
      {formMode === 'transaction' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">
              {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
            </h2>
            <TransactionForm
              transaction={editingTransaction || undefined}
              onSubmit={handleTransactionSubmit}
              onCancel={handleFormCancel}
              mode={editingTransaction ? 'edit' : 'create'}
            />
          </div>
        </div>
      )}

      {/* Split Transaction Form Modal */}
      {formMode === 'split' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">
              {editingTransaction ? 'Edit Split Transaction' : 'Add Split Transaction'}
            </h2>
            <SplitTransactionForm
              onSubmit={handleSplitSubmit}
              onCancel={handleFormCancel}
            />
          </div>
        </div>
      )}

      {/* Transfer Form Modal */}
      {formMode === 'transfer' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">
              {editingTransaction ? 'Edit Transfer' : 'Add Transfer'}
            </h2>
            <TransferForm
              onSubmit={handleTransferSubmit}
              onCancel={handleFormCancel}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-red-600">Delete Transaction</h2>
            <p className="text-sm sm:text-base text-gray-700 mb-6">
              Are you sure you want to delete this transaction?
              {deletingTransaction.isParent && (
                <span className="block mt-2 text-sm text-red-600">
                  This will also delete all split items.
                </span>
              )}
            </p>
            <div className="bg-gray-50 p-3 rounded mb-6">
              <p className="text-sm break-words">
                <strong>Description:</strong> {deletingTransaction.description}
              </p>
              <p className="text-sm">
                <strong>Amount:</strong> ${deletingTransaction.amount}
              </p>
              <p className="text-sm">
                <strong>Date:</strong> {new Date(deletingTransaction.date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setDeletingTransaction(null)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
