import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, CreateTransactionRequest } from '../types';
import { formatDateForInput } from '../utils/formatters';
import AccountSelector from './AccountSelector';
import CategorySelector from './CategorySelector';
import TagInput from './TagInput';

interface TransactionFormProps {
  transaction?: Transaction; // For edit mode
  onSubmit: (data: CreateTransactionRequest) => Promise<void>;
  onCancel: () => void;
  mode?: 'create' | 'edit';
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  transaction,
  onSubmit,
  onCancel,
  mode = 'create',
}) => {
  const [formData, setFormData] = useState<{
    date: string;
    amount: number;
    type: TransactionType;
    description: string;
    notes: string;
    accountId: string;
    categoryId: string;
    tagIds: string[];
  }>({
    date: formatDateForInput(new Date()),
    amount: 0,
    type: TransactionType.EXPENSE,
    description: '',
    notes: '',
    accountId: '',
    categoryId: '',
    tagIds: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (transaction && mode === 'edit') {
      setFormData({
        date: formatDateForInput(transaction.date),
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description,
        notes: transaction.notes || '',
        accountId: transaction.accountId,
        categoryId: transaction.categoryId || '',
        tagIds: transaction.tags?.map((tag) => tag.id) || [],
      });
    }
  }, [transaction, mode]);

  const handleChange = (
    field: string,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.accountId) {
      newErrors.accountId = 'Account is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Clean up data before submission
      const submitData: CreateTransactionRequest = {
        ...formData,
        amount: Number(formData.amount),
        notes: formData.notes || undefined,
        categoryId: formData.categoryId || undefined,
        tagIds: formData.tagIds.length > 0 ? formData.tagIds : undefined,
      };

      await onSubmit(submitData);
    } catch (err: any) {
      // Handle submission errors
      if (err.details) {
        const fieldErrors: Record<string, string> = {};
        err.details.forEach((detail: any) => {
          fieldErrors[detail.field] = detail.message;
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ submit: err.message || 'Failed to save transaction' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Transaction Type */}
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Type
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value={TransactionType.INCOME}
              checked={formData.type === TransactionType.INCOME}
              onChange={(e) => handleChange('type', e.target.value as TransactionType)}
              className="mr-2"
            />
            <span className="text-green-600 font-medium">Income</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value={TransactionType.EXPENSE}
              checked={formData.type === TransactionType.EXPENSE}
              onChange={(e) => handleChange('type', e.target.value as TransactionType)}
              className="mr-2"
            />
            <span className="text-red-600 font-medium">Expense</span>
          </label>
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Date
          <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => handleChange('date', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.date ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        />
        {errors.date && (
          <p className="text-red-500 text-sm mt-1">{errors.date}</p>
        )}
      </div>

      {/* Amount */}
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Amount
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-gray-500">$</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.amount || ''}
            onChange={(e) => handleChange('amount', e.target.value)}
            className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.amount ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0.00"
            required
          />
        </div>
        {errors.amount && (
          <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Description
          <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter transaction description"
          required
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description}</p>
        )}
      </div>

      {/* Account */}
      <AccountSelector
        value={formData.accountId}
        onChange={(accountId) => handleChange('accountId', accountId)}
        label="Account"
        required
      />
      {errors.accountId && (
        <p className="text-red-500 text-sm mt-1">{errors.accountId}</p>
      )}

      {/* Category */}
      <CategorySelector
        value={formData.categoryId}
        onChange={(categoryId) => handleChange('categoryId', categoryId)}
        label="Category"
        allowEmpty
      />

      {/* Tags */}
      <TagInput
        value={formData.tagIds}
        onChange={(tagIds) => handleChange('tagIds', tagIds)}
        label="Tags"
      />

      {/* Notes */}
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Add any additional notes (optional)"
          rows={3}
        />
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-300 rounded-lg">
          <p className="text-red-600 text-sm">{errors.submit}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`flex-1 px-4 py-2 rounded-lg font-medium text-white ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting
            ? 'Saving...'
            : mode === 'edit'
            ? 'Update Transaction'
            : 'Create Transaction'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
