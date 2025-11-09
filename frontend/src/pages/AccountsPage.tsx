import React, { useState, useEffect } from 'react';
import { accountService } from '../services/accountService';
import { Account, AccountType, CreateAccountRequest, UpdateAccountRequest } from '../types';
import { formatCurrency, formatAccountType } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';
import { useAsync } from '../hooks/useAsync';
import LoadingSpinner, { ButtonSpinner } from '../components/LoadingSpinner';
import { formatApiError } from '../services/api';

const AccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const toast = useToast();

  // Form state
  const [formData, setFormData] = useState<CreateAccountRequest>({
    name: '',
    type: AccountType.CHECKING,
    initialBalance: 0,
    initialBalanceDate: new Date().toISOString().split('T')[0],
  });

  // Load accounts
  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountService.getAll();
      setAccounts(data);
    } catch (err: any) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Create account with async hook
  const createAccount = useAsync(
    async () => {
      await accountService.create(formData);
      setShowCreateForm(false);
      setFormData({ name: '', type: AccountType.CHECKING });
      await loadAccounts();
    },
    {
      showSuccessToast: true,
      successMessage: 'Account created successfully',
      showErrorToast: true,
    }
  );

  // Update account with async hook
  const updateAccount = useAsync(
    async () => {
      if (!editingAccount) return;
      const updateData: UpdateAccountRequest = {
        name: formData.name,
        type: formData.type,
        initialBalance: formData.initialBalance,
        initialBalanceDate: formData.initialBalanceDate ? new Date(formData.initialBalanceDate + 'T12:00:00').toISOString() : undefined,
      };
      await accountService.update(editingAccount.id, updateData);
      setEditingAccount(null);
      setFormData({ 
        name: '', 
        type: AccountType.CHECKING, 
        initialBalance: 0, 
        initialBalanceDate: new Date().toISOString().split('T')[0] 
      });
      await loadAccounts();
    },
    {
      showSuccessToast: true,
      successMessage: 'Account updated successfully',
      showErrorToast: true,
    }
  );

  // Delete account with async hook
  const deleteAccount = useAsync(
    async () => {
      if (!deletingAccount) return;
      await accountService.delete(deletingAccount.id);
      setDeletingAccount(null);
      await loadAccounts();
    },
    {
      showSuccessToast: true,
      successMessage: 'Account deleted successfully',
      showErrorToast: true,
    }
  );

  // Handle create account
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAccount.execute();
  };

  // Handle update account
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateAccount.execute();
  };

  // Handle delete account
  const handleDelete = async () => {
    await deleteAccount.execute();
  };

  // Open edit modal
  const openEditModal = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      initialBalance: account.initialBalance || 0,
      initialBalanceDate: account.initialBalanceDate ? account.initialBalanceDate.split('T')[0] : new Date().toISOString().split('T')[0],
    });
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditingAccount(null);
    setFormData({ 
      name: '', 
      type: AccountType.CHECKING, 
      initialBalance: 0, 
      initialBalanceDate: new Date().toISOString().split('T')[0] 
    });
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
          <LoadingSpinner size="lg" text="Loading accounts..." />
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
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
              <div className="mb-4">
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
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Initial Balance (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.initialBalance || 0}
                  onChange={(e) => setFormData({ ...formData, initialBalance: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Set the starting balance if you don't have full transaction history
                </p>
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Initial Balance Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.initialBalanceDate || ''}
                  onChange={(e) => setFormData({ ...formData, initialBalanceDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Date from which to calculate balance
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({ name: '', type: AccountType.CHECKING, initialBalance: 0, initialBalanceDate: new Date().toISOString().split('T')[0] });
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAccount.loading}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {createAccount.loading ? <ButtonSpinner /> : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {editingAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
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
              <div className="mb-4">
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
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Initial Balance (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.initialBalance || 0}
                  onChange={(e) => setFormData({ ...formData, initialBalance: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Set the starting balance if you don't have full transaction history
                </p>
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Initial Balance Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.initialBalanceDate || ''}
                  onChange={(e) => setFormData({ ...formData, initialBalanceDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Date from which to calculate balance
                </p>
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
                  disabled={updateAccount.loading}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {updateAccount.loading ? <ButtonSpinner /> : 'Save Changes'}
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
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete <strong>{deletingAccount.name}</strong>?
            </p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Note:</strong> Accounts with existing transactions cannot be deleted. 
                    You must delete all transactions first.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeletingAccount(null)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteAccount.loading}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {deleteAccount.loading ? <ButtonSpinner /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsPage;
