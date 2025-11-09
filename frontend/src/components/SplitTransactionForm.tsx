import React, { useState, useEffect } from 'react';
import { CreateSplitTransactionRequest } from '../types';
import { formatDateForInput } from '../utils/formatters';
import AccountSelector from './AccountSelector';
import CategorySelector from './CategorySelector';

interface SplitItem {
  amount: number;
  description: string;
  categoryId: string;
  notes: string;
}

interface SplitTransactionFormProps {
  onSubmit: (data: CreateSplitTransactionRequest) => Promise<void>;
  onCancel: () => void;
}

const SplitTransactionForm: React.FC<SplitTransactionFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    date: formatDateForInput(new Date()),
    amount: 0,
    description: '',
    accountId: '',
  });

  const [items, setItems] = useState<SplitItem[]>([
    { amount: 0, description: '', categoryId: '', notes: '' },
    { amount: 0, description: '', categoryId: '', notes: '' },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [itemErrors, setItemErrors] = useState<Record<number, Record<string, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate total of all items
  const calculateItemsTotal = (): number => {
    return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  };

  // Update parent amount when items change
  useEffect(() => {
    const total = calculateItemsTotal();
    setFormData((prev) => ({ ...prev, amount: total }));
  }, [items]);

  const handleChange = (field: keyof typeof formData, value: any) => {
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

  const handleItemChange = (
    index: number,
    field: keyof SplitItem,
    value: any
  ) => {
    setItems((prev) => {
      const newItems = [...prev];
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };
      return newItems;
    });

    // Clear error for this item field
    if (itemErrors[index]?.[field]) {
      setItemErrors((prev) => {
        const newErrors = { ...prev };
        if (newErrors[index]) {
          delete newErrors[index][field];
          if (Object.keys(newErrors[index]).length === 0) {
            delete newErrors[index];
          }
        }
        return newErrors;
      });
    }
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { amount: 0, description: '', categoryId: '', notes: '' },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 2) {
      return; // Keep at least 2 items
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
    // Clear errors for removed item
    setItemErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const newItemErrors: Record<number, Record<string, string>> = {};

    // Validate parent fields
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.accountId) {
      newErrors.accountId = 'Account is required';
    }

    // Validate items
    let hasValidItems = false;
    items.forEach((item, index) => {
      const itemErrs: Record<string, string> = {};

      if (!item.amount || item.amount <= 0) {
        itemErrs.amount = 'Amount must be greater than 0';
      }

      if (!item.description.trim()) {
        itemErrs.description = 'Description is required';
      }

      if (Object.keys(itemErrs).length > 0) {
        newItemErrors[index] = itemErrs;
      } else {
        hasValidItems = true;
      }
    });

    if (!hasValidItems) {
      newErrors.items = 'At least one valid item is required';
    }

    // Validate that total matches
    const itemsTotal = calculateItemsTotal();
    if (itemsTotal <= 0) {
      newErrors.amount = 'Total amount must be greater than 0';
    }

    setErrors(newErrors);
    setItemErrors(newItemErrors);
    return Object.keys(newErrors).length === 0 && Object.keys(newItemErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData: CreateSplitTransactionRequest = {
        date: formData.date,
        amount: calculateItemsTotal(),
        description: formData.description,
        accountId: formData.accountId,
        items: items.map((item) => ({
          amount: Number(item.amount),
          description: item.description,
          categoryId: item.categoryId || undefined,
          notes: item.notes || undefined,
        })),
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
        setErrors({ submit: err.message || 'Failed to save split transaction' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const itemsTotal = calculateItemsTotal();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Split Transaction
        </h3>
        <p className="text-sm text-blue-700">
          Split a single transaction into multiple items with different categories.
          The total amount will be calculated from all items.
        </p>
      </div>

      {/* Parent Transaction Fields */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-700">Transaction Details</h4>

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
            placeholder="e.g., Walmart Receipt"
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

        {/* Total Amount (calculated) */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Total Amount
          </label>
          <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-semibold">
            ${itemsTotal.toFixed(2)}
          </div>
          {errors.amount && (
            <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
          )}
        </div>
      </div>

      {/* Split Items */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-gray-700">Items</h4>
          <button
            type="button"
            onClick={handleAddItem}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            + Add Item
          </button>
        </div>

        {items.map((item, index) => (
          <div
            key={index}
            className="p-4 border border-gray-300 rounded-lg bg-gray-50 space-y-3"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-700">Item {index + 1}</span>
              {items.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Item Amount */}
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
                  value={item.amount || ''}
                  onChange={(e) =>
                    handleItemChange(index, 'amount', e.target.value)
                  }
                  className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    itemErrors[index]?.amount
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
              </div>
              {itemErrors[index]?.amount && (
                <p className="text-red-500 text-sm mt-1">
                  {itemErrors[index].amount}
                </p>
              )}
            </div>

            {/* Item Description */}
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Description
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={item.description}
                onChange={(e) =>
                  handleItemChange(index, 'description', e.target.value)
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  itemErrors[index]?.description
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
                placeholder="e.g., Groceries"
              />
              {itemErrors[index]?.description && (
                <p className="text-red-500 text-sm mt-1">
                  {itemErrors[index].description}
                </p>
              )}
            </div>

            {/* Item Category */}
            <CategorySelector
              value={item.categoryId}
              onChange={(categoryId) =>
                handleItemChange(index, 'categoryId', categoryId)
              }
              label="Category"
              allowEmpty
            />

            {/* Item Notes */}
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Notes
              </label>
              <input
                type="text"
                value={item.notes}
                onChange={(e) =>
                  handleItemChange(index, 'notes', e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional notes"
              />
            </div>
          </div>
        ))}

        {errors.items && (
          <p className="text-red-500 text-sm">{errors.items}</p>
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
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Saving...' : 'Create Split Transaction'}
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

export default SplitTransactionForm;
