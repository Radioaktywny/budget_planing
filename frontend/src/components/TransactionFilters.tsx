import React, { useState, useEffect } from 'react';
import { TransactionFilters as Filters, Account, Category, Tag, TransactionType } from '../types';
import { accountService } from '../services/accountService';
import { categoryService } from '../services/categoryService';
import { tagService } from '../services/tagService';
import { formatCurrency } from '../utils/formatters';

interface TransactionFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  totalAmount?: number;
  totalCount?: number;
}

const TransactionFiltersComponent: React.FC<TransactionFiltersProps> = ({
  filters,
  onFiltersChange,
  totalAmount,
  totalCount,
}) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.tagIds || []);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load filter options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [accountsData, categoriesData, tagsData] = await Promise.all([
          accountService.getAll(),
          categoryService.getAll(),
          tagService.getAll(),
        ]);
        setAccounts(accountsData);
        setCategories(categoriesData);
        setTags(tagsData);
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    };
    loadOptions();
  }, []);

  // Handle filter change
  const handleFilterChange = (key: keyof Filters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  // Handle tag selection
  const handleTagToggle = (tagId: string) => {
    const newSelectedTags = selectedTags.includes(tagId)
      ? selectedTags.filter((id) => id !== tagId)
      : [...selectedTags, tagId];
    
    setSelectedTags(newSelectedTags);
    handleFilterChange('tagIds', newSelectedTags.length > 0 ? newSelectedTags : undefined);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedTags([]);
    onFiltersChange({
      page: 1,
      limit: filters.limit,
    });
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return !!(
      filters.startDate ||
      filters.endDate ||
      filters.accountId ||
      filters.categoryId ||
      filters.search ||
      filters.type ||
      (filters.tagIds && filters.tagIds.length > 0)
    );
  };

  // Build hierarchical category list
  const buildCategoryOptions = (categories: Category[], parentId: string | null = null, level: number = 0): React.ReactElement[] => {
    const filtered = categories.filter((cat) => cat.parentId === parentId);
    const options: React.ReactElement[] = [];

    filtered.forEach((category) => {
      options.push(
        <option key={category.id} value={category.id}>
          {'  '.repeat(level)}
          {level > 0 ? '└ ' : ''}
          {category.name}
        </option>
      );
      options.push(...buildCategoryOptions(categories, category.id, level + 1));
    });

    return options;
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      {/* Basic Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Account Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account
          </label>
          <select
            value={filters.accountId || ''}
            onChange={(e) => handleFilterChange('accountId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Description
          </label>
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search transactions..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <div className="mb-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {showAdvanced ? '▼' : '▶'} Advanced Filters
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-200">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={filters.categoryId || ''}
              onChange={(e) => handleFilterChange('categoryId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All Categories</option>
              {buildCategoryOptions(categories)}
            </select>
          </div>

          {/* Transaction Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={filters.type || ''}
              onChange={(e) => handleFilterChange('type', e.target.value as TransactionType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All Types</option>
              <option value={TransactionType.INCOME}>Income</option>
              <option value={TransactionType.EXPENSE}>Expense</option>
              <option value={TransactionType.TRANSFER}>Transfer</option>
            </select>
          </div>

          {/* Tag Filter */}
          <div className="md:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="border border-gray-300 rounded-lg p-2 max-h-32 overflow-y-auto">
              {tags.length === 0 ? (
                <p className="text-sm text-gray-500">No tags available</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleTagToggle(tag.id)}
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedTags.includes(tag.id)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      #{tag.name}
                      {tag.usageCount !== undefined && (
                        <span className="ml-1 opacity-75">({tag.usageCount})</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter Summary and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Results Summary */}
          {totalCount !== undefined && (
            <div className="text-sm text-gray-600">
              <span className="font-semibold">{totalCount}</span> transaction{totalCount !== 1 ? 's' : ''}
              {totalAmount !== undefined && (
                <>
                  {' • '}
                  <span className="font-semibold">{formatCurrency(totalAmount)}</span> total
                </>
              )}
            </div>
          )}
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters() && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
};

export default TransactionFiltersComponent;
