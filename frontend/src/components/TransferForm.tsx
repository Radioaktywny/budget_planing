import React, { useState } from 'react';
import { CreateTransferRequest } from '../types';
import { formatDateForInput } from '../utils/formatters';
import AccountSelector from './AccountSelector';

interface TransferFormProps {
  onSubmit: (data: CreateTransferRequest) => Promise<void>;
  onCancel: () => void;
}

const TransferForm: React.FC<TransferFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<CreateTransferRequest>({
    date: formatDateForInput(new Date()),
    amount: 0,
    description: '',
    fromAccountId: '',
    toAccountId: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    field: keyof CreateTransferRequest,
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

    if (!formData.fromAccountId) {
      newErrors.fromAccountId = 'From account is required';
    }

    if (!formData.toAccountId) {
      newErrors.toAccountId = 'To account is required';
    }

    if (formData.fromAccountId && formData.toAccountId && 
        formData.fromAccountId === formData.toAccountId) {
      newErrors.toAccountId = 'From and To accounts must be different';
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
      const submitData: CreateTransferRequest = {
        ...formData,
        amount: Number(formData.amount),
      };

      await onSubmit(submitData);
    } catch (err: any) {
      if (err.details) {
        const fieldErrors: Record<string, string> = {};
        err.details.forEach((detail: any) => {
          fieldErrors[detail.field] = detail.message;
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ submit: err.message || 'Failed to create transfer' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-purple-900 mb-2">
          Transfer Between Accounts
        </h3>
        <p className="text-sm text-purple-700">
          Move money from one account to another. This will not affect your income or expense totals.
        </p>
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

      {/* From Account */}
      <AccountSelector
        value={formData.fromAccountId}
        onChange={(accountId) => handleChange('fromAccountId', accountId)}
        label="From Account"
        required
      />
      {errors.fromAccountId && (
        <p className="text-red-500 text-sm mt-1">{errors.fromAccountId}</p>
      )}

      {/* Transfer Direction Indicator */}
      <div className="flex justify-center">
        <div className="text-3xl text-gray-400">↓</div>
      </div>

      {/* To Account */}
      <AccountSelector
        value={formData.toAccountId}
        onChange={(accountId) => handleChange('toAccountId', accountId)}
        label="To Account"
        required
        excludeAccountId={formData.fromAccountId}
      />
      {errors.toAccountId && (
        <p className="text-red-500 text-sm mt-1">{errors.toAccountId}</p>
      )}

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
          placeholder="e.g., Transfer to savings"
          required
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description}</p>
        )}
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
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          {isSubmitting ? 'Creating Transfer...' : 'Create Transfer'}
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

export default TransferForm;
