import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import DocumentViewer from './DocumentViewer';

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string) => void;
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onEdit,
  onDelete,
  sortBy,
  sortOrder,
  onSort,
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [viewingDocumentId, setViewingDocumentId] = useState<string | null>(null);

  // Toggle row expansion for split transactions
  const toggleRow = (transactionId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(transactionId)) {
      newExpanded.delete(transactionId);
    } else {
      newExpanded.add(transactionId);
    }
    setExpandedRows(newExpanded);
  };

  // Get transaction type badge color
  const getTypeColor = (type: TransactionType): string => {
    switch (type) {
      case TransactionType.INCOME:
        return 'bg-green-100 text-green-800';
      case TransactionType.EXPENSE:
        return 'bg-red-100 text-red-800';
      case TransactionType.TRANSFER:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get amount color
  const getAmountColor = (type: TransactionType): string => {
    switch (type) {
      case TransactionType.INCOME:
        return 'text-green-600';
      case TransactionType.EXPENSE:
        return 'text-red-600';
      case TransactionType.TRANSFER:
        return 'text-blue-600';
      default:
        return 'text-gray-900';
    }
  };

  // Format amount with sign
  const formatAmount = (amount: number, type: TransactionType): string => {
    const formatted = formatCurrency(amount);
    if (type === TransactionType.INCOME) {
      return `+${formatted}`;
    } else if (type === TransactionType.EXPENSE) {
      return `-${formatted}`;
    }
    return formatted;
  };

  // Render sort icon
  const renderSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <span className="text-gray-400 ml-1">⇅</span>;
    }
    return sortOrder === 'asc' ? (
      <span className="text-blue-600 ml-1">↑</span>
    ) : (
      <span className="text-blue-600 ml-1">↓</span>
    );
  };

  // Handle column header click
  const handleHeaderClick = (column: string) => {
    if (onSort) {
      onSort(column);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-8 px-3 py-3"></th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleHeaderClick('date')}
              >
                <div className="flex items-center">
                  Date
                  {renderSortIcon('date')}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleHeaderClick('description')}
              >
                <div className="flex items-center">
                  Description
                  {renderSortIcon('description')}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleHeaderClick('category')}
              >
                <div className="flex items-center">
                  Category
                  {renderSortIcon('category')}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleHeaderClick('amount')}
              >
                <div className="flex items-center">
                  Amount
                  {renderSortIcon('amount')}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleHeaderClick('account')}
              >
                <div className="flex items-center">
                  Account
                  {renderSortIcon('account')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <React.Fragment key={transaction.id}>
                {/* Main transaction row */}
                <tr className="hover:bg-gray-50">
                  <td className="px-3 py-4">
                    {transaction.isParent && transaction.splitItems && transaction.splitItems.length > 0 && (
                      <button
                        onClick={() => toggleRow(transaction.id)}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                      >
                        {expandedRows.has(transaction.id) ? '▼' : '▶'}
                      </button>
                    )}
                    {transaction.documentId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingDocumentId(transaction.documentId!);
                        }}
                        className="text-blue-500 hover:text-blue-700 ml-1"
                        title="View attachment"
                      >
                        📎
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex flex-col">
                      <span className="font-medium">{transaction.description}</span>
                      {transaction.notes && (
                        <span className="text-xs text-gray-500 mt-1">{transaction.notes}</span>
                      )}
                      {transaction.tags && transaction.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {transaction.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                            >
                              #{tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                      {transaction.transfer && (
                        <span className="text-xs text-blue-600 mt-1">
                          {transaction.transfer.fromAccount?.name} → {transaction.transfer.toAccount?.name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.category ? (
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: transaction.category.color
                            ? `${transaction.category.color}20`
                            : '#f3f4f6',
                          color: transaction.category.color || '#374151',
                        }}
                      >
                        {transaction.category.name}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Uncategorized</span>
                    )}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${getAmountColor(transaction.type)}`}>
                    {formatAmount(transaction.amount, transaction.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.account?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(transaction.type)}`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onEdit(transaction)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(transaction)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>

                {/* Split items rows */}
                {transaction.isParent &&
                  transaction.splitItems &&
                  transaction.splitItems.length > 0 &&
                  expandedRows.has(transaction.id) &&
                  transaction.splitItems.map((item) => (
                    <tr key={item.id} className="bg-gray-50">
                      <td className="px-3 py-3"></td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500"></td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        <div className="pl-6 flex items-center">
                          <span className="text-gray-400 mr-2">↳</span>
                          <span>{item.description}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">
                        {item.category ? (
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: item.category.color
                                ? `${item.category.color}20`
                                : '#f3f4f6',
                              color: item.category.color || '#374151',
                            }}
                          >
                            {item.category.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Uncategorized</span>
                        )}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500"></td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500"></td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500"></td>
                    </tr>
                  ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Document Viewer Modal */}
      {viewingDocumentId && (
        <DocumentViewer
          documentId={viewingDocumentId}
          isOpen={true}
          onClose={() => setViewingDocumentId(null)}
        />
      )}
    </div>
  );
};

export default TransactionTable;
