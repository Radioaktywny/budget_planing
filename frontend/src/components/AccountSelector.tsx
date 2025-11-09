import React, { useState, useEffect } from 'react';
import { accountService } from '../services/accountService';
import { Account, AccountType } from '../types';
import { formatAccountType } from '../utils/formatters';

interface AccountSelectorProps {
  value: string;
  onChange: (accountId: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
  excludeAccountId?: string; // For transfers, exclude the source account
}

const AccountSelector: React.FC<AccountSelectorProps> = ({
  value,
  onChange,
  label = 'Account',
  required = false,
  className = '',
  excludeAccountId,
}) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

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

  const filteredAccounts = excludeAccountId
    ? accounts.filter((account) => account.id !== excludeAccountId)
    : accounts;

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
          Loading accounts...
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
        <option value="">Select an account</option>
        {filteredAccounts.map((account) => (
          <option key={account.id} value={account.id}>
            {getAccountIcon(account.type)} {account.name} ({formatAccountType(account.type)})
          </option>
        ))}
      </select>
      {filteredAccounts.length === 0 && (
        <p className="text-sm text-gray-500 mt-1">
          No accounts available. Please create an account first.
        </p>
      )}
    </div>
  );
};

export default AccountSelector;
