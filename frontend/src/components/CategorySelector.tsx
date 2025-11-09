import React, { useState, useEffect } from 'react';
import { categoryService } from '../services/categoryService';
import { Category, CreateCategoryRequest } from '../types';

interface CategorySelectorProps {
  value: string;
  onChange: (categoryId: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
  allowEmpty?: boolean;
  allowCreate?: boolean;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
  label = 'Category',
  required = false,
  className = '',
  allowEmpty = true,
  allowCreate = false,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryParent, setNewCategoryParent] = useState<string>('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  const [creating, setCreating] = useState(false);

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

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      setCreating(true);
      const createData: CreateCategoryRequest = {
        name: newCategoryName.trim(),
        parentId: newCategoryParent || undefined,
        color: newCategoryColor,
      };
      const newCategory = await categoryService.create(createData);
      await loadCategories();
      onChange(newCategory.id);
      setShowCreateModal(false);
      setNewCategoryName('');
      setNewCategoryParent('');
      setNewCategoryColor('#3B82F6');
    } catch (err: any) {
      alert(err.message || 'Failed to create category');
    } finally {
      setCreating(false);
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue === '__create_new__') {
      setShowCreateModal(true);
    } else {
      onChange(selectedValue);
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
    <>
      <div className={className}>
        {label && (
          <label className="block text-gray-700 text-sm font-bold mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select
          value={value}
          onChange={handleSelectChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required={required}
        >
          {allowEmpty && <option value="">Select a category</option>}
          {buildCategoryOptions(categories)}
          {allowCreate && (
            <option value="__create_new__" className="text-blue-600 font-semibold">
              + Create New Category
            </option>
          )}
        </select>
        {categories.length === 0 && (
          <p className="text-sm text-gray-500 mt-1">
            No categories available. {allowCreate ? 'Create your first category.' : 'Please create a category first.'}
          </p>
        )}
      </div>

      {/* Create Category Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">Create New Category</h2>
            <form onSubmit={handleCreateCategory}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter category name"
                  required
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Parent Category
                </label>
                <select
                  value={newCategoryParent}
                  onChange={(e) => setNewCategoryParent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None (Top Level)</option>
                  {buildCategoryOptions(categories)}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewCategoryName('');
                    setNewCategoryParent('');
                    setNewCategoryColor('#3B82F6');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CategorySelector;
