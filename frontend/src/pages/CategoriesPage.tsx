import React, { useState, useEffect } from 'react';
import { categoryService } from '../services/categoryService';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../types';

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [reassignCategoryId, setReassignCategoryId] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState<CreateCategoryRequest>({
    name: '',
    parentId: undefined,
    color: '#3B82F6',
  });

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
    try {
      await categoryService.create(formData);
      await loadCategories();
      setShowCreateForm(false);
      setFormData({ name: '', parentId: undefined, color: '#3B82F6' });
    } catch (err: any) {
      alert(err.message || 'Failed to create category');
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      const updateData: UpdateCategoryRequest = {
        name: formData.name,
        parentId: formData.parentId,
        color: formData.color,
      };
      await categoryService.update(editingCategory.id, updateData);
      await loadCategories();
      setEditingCategory(null);
      setFormData({ name: '', parentId: undefined, color: '#3B82F6' });
    } catch (err: any) {
      alert(err.message || 'Failed to update category');
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    try {
      await categoryService.delete(deletingCategory.id, {
        reassignToCategoryId: reassignCategoryId || undefined,
      });
      await loadCategories();
      setDeletingCategory(null);
      setReassignCategoryId('');
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    }
  };

  const startEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      parentId: category.parentId,
      color: category.color || '#3B82F6',
    });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setFormData({ name: '', parentId: undefined, color: '#3B82F6' });
  };

  const startCreate = () => {
    setShowCreateForm(true);
    setEditingCategory(null);
    setFormData({ name: '', parentId: undefined, color: '#3B82F6' });
  };

  // Build hierarchical category tree
  const buildCategoryTree = (parentId: string | null = null, level: number = 0): React.ReactElement[] => {
    const filtered = categories.filter(cat => cat.parentId === parentId);
    const elements: React.ReactElement[] = [];

    filtered.forEach(category => {
      const hasChildren = categories.some(c => c.parentId === category.id);
      const indent = level * 24;

      elements.push(
        <div
          key={category.id}
          className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 border-b border-gray-200"
          style={{ paddingLeft: `${indent + 16}px` }}
        >
          <div className="flex items-center gap-3 flex-1">
            {/* Color indicator */}
            <div
              className="w-4 h-4 rounded-full border border-gray-300"
              style={{ backgroundColor: category.color || '#3B82F6' }}
            />
            
            {/* Category name */}
            <span className="font-medium text-gray-900">{category.name}</span>
            
            {/* Parent indicator */}
            {hasChildren && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Parent
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => startEdit(category)}
              className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
            >
              Edit
            </button>
            <button
              onClick={() => setDeletingCategory(category)}
              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
            >
              Delete
            </button>
          </div>
        </div>
      );

      // Recursively add children
      elements.push(...buildCategoryTree(category.id, level + 1));
    });

    return elements;
  };

  // Get available parent categories (exclude self and descendants when editing)
  const getAvailableParentCategories = (): Category[] => {
    if (!editingCategory) return categories;

    const excludeIds = new Set<string>([editingCategory.id]);
    
    // Find all descendants
    const findDescendants = (parentId: string) => {
      categories.forEach(cat => {
        if (cat.parentId === parentId) {
          excludeIds.add(cat.id);
          findDescendants(cat.id);
        }
      });
    };
    findDescendants(editingCategory.id);

    return categories.filter(cat => !excludeIds.has(cat.id));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading categories...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Categories</h1>
        <button
          onClick={startCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + New Category
        </button>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingCategory) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            {editingCategory ? 'Edit Category' : 'Create New Category'}
          </h2>
          <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Parent Category
                </label>
                <select
                  value={formData.parentId || ''}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None (Top Level)</option>
                  {getAvailableParentCategories().map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingCategory ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  cancelEdit();
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category List */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No categories yet. Create your first category to get started.
          </div>
        ) : (
          <div>
            {buildCategoryTree()}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">Delete Category</h2>
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete "{deletingCategory.name}"?
            </p>

            {/* Check if category has transactions */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Reassign transactions to:
              </label>
              <select
                value={reassignCategoryId}
                onChange={(e) => setReassignCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category (optional)</option>
                {categories
                  .filter(cat => cat.id !== deletingCategory.id)
                  .map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                If this category has transactions, they will be reassigned to the selected category.
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setDeletingCategory(null);
                  setReassignCategoryId('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCategory}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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

export default CategoriesPage;
