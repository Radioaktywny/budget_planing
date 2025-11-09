import React, { useState, useEffect } from 'react';
import { accountService } from '../services/accountService';
import { Account, AccountType, CreateAccountRequest, UpdateAccountRequest } from '../types';
import { formatCurrency, formatAccountType } from '../utils/formatters';

const AccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateAccountRequest>({
    name: '',
    type: AccountType.CHECKING,
  });

  // Load accounts
  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await accountService.getAll();
      setAccounts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  // Handle create account
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await accountService.create(formData);
      setShowCreateForm(false);
      setFormData({ name: '', type: AccountType.CHECKING });
      await loadAccounts();
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    }
  };

  // Handle update account
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    try {
      const updateData: UpdateAccountRequest = {
        name: formData.name,
        type: formData.type,
      };
      await accountService.update(editingAccount.id, updateData);
      setEditingAccount(null);
      setFormData({ name: '', type: AccountType.CHECKING });
      await loadAccounts();
    } catch (err: any) {
      setError(err.message || 'Failed to update account');
    }
  };

  // Handle delete account
  const handleDelete = async () => {
    if (!deletingAccount) return;

    try {
      await accountService.delete(deletingAccount.id);
      setDeletingAccount(null);
      await loadAccounts();
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
    }
  };

  // Open edit modal
  const openEditModal = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
    });
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditingAccount(null);
    setFormData({ name: '', type: AccountType.CHECKING });
  };

  // Get account type icon
  const getAccountIcon = (type: AccountType): string => {
    switch (type) {
      case AccountType.CHECKING:
        return '💳';
      case AccountType.SAVINGS:
        return '🏦';
      case AccountType.CREDIT_CARD:
        return '💳';
      case AccountType.CASH:
        return '💵';
      default:
        return '🏦';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading accounts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Accounts</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          + Add Account
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Accounts list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <span className="text-3xl mr-3">{getAccountIcon(account.type)}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{account.name}</h3>
                  <p className="text-sm text-gray-500">{formatAccountType(account.type)}</p>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(account.balance)}</p>
              <p className="text-xs text-gray-500">Current Balance</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => openEditModal(account)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded transition-colors text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => setDeletingAccount(account)}
                className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {accounts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No accounts yet</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Create Your First Account
          </button>
        </div>
      )}

      {/* Create Account Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Create New Account</h2>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Account Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Main Checking"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Account Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as AccountType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={AccountType.CHECKING}>Checking</option>
                  <option value={AccountType.SAVINGS}>Savings</option>
                  <option value={AccountType.CREDIT_CARD}>Credit Card</option>
                  <option value={AccountType.CASH}>Cash</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({ name: '', type: AccountType.CHECKING });
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {editingAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Edit Account</h2>
            <form onSubmit={handleUpdate}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Account Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Main Checking"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Account Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as AccountType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={AccountType.CHECKING}>Checking</option>
                  <option value={AccountType.SAVINGS}>Savings</option>
                  <option value={AccountType.CREDIT_CARD}>Credit Card</option>
                  <option value={AccountType.CASH}>Cash</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Delete Account</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>{deletingAccount.name}</strong>? This action
              cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeletingAccount(null)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
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

export default AccountsPage;
