import React, { useState, useEffect } from 'react';
import { categoryService } from '../services/categoryService';
import { Category } from '../types';

interface CategorySelectorProps {
  value: string;
  onChange: (categoryId: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
  allowEmpty?: boolean;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
  label = 'Category',
  required = false,
  className = '',
  allowEmpty = true,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  // Build hierarchical category list with indentation
  const buildCategoryOptions = (categories: Category[], parentId: string | null = null, level: number = 0): React.ReactElement[] => {
    const filtered = categories.filter(cat => cat.parentId === parentId);
    const options: React.ReactElement[] = [];

    filtered.forEach(category => {
      const indent = '  '.repeat(level);
      options.push(
        <option key={category.id} value={category.id}>
          {indent}{category.name}
        </option>
      );
      // Recursively add children
      options.push(...buildCategoryOptions(categories, category.id, level + 1));
    });

    return options;
  };

  if (loading) {
    return (
      <div className={className}>
        {label && (
          <label className="block text-gray-700 text-sm font-bold mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
          Loading categories...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        {label && (
          <label className="block text-gray-700 text-sm font-bold mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="w-full px-3 py-2 border border-red-300 rounded-lg bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-gray-700 text-sm font-bold mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        required={required}
      >
        {allowEmpty && <option value="">Select a category</option>}
        {buildCategoryOptions(categories)}
      </select>
      {categories.length === 0 && (
        <p className="text-sm text-gray-500 mt-1">
          No categories available. Please create a category first.
        </p>
      )}
    </div>
  );
};

export default CategorySelector;
