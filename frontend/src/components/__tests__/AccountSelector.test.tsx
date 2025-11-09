import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AccountSelector from '../AccountSelector';
import { accountService } from '../../services/accountService';
import { Account, AccountType } from '../../types';

// Mock the account service
jest.mock('../../services/accountService');

const mockAccounts: Account[] = [
  {
    id: '1',
    name: 'Checking Account',
    type: AccountType.CHECKING,
    balance: 1000,
    userId: 'user1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Savings Account',
    type: AccountType.SAVINGS,
    balance: 5000,
    userId: 'user1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

describe('AccountSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (accountService.getAll as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<AccountSelector value="" onChange={() => {}} />);
    expect(screen.getByText('Loading accounts...')).toBeInTheDocument();
  });

  it('renders accounts after loading', async () => {
    (accountService.getAll as jest.Mock).mockResolvedValue(mockAccounts);

    render(<AccountSelector value="" onChange={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/Checking Account/)).toBeInTheDocument();
      expect(screen.getByText(/Savings Account/)).toBeInTheDocument();
    });
  });

  it('excludes specified account', async () => {
    (accountService.getAll as jest.Mock).mockResolvedValue(mockAccounts);

    render(<AccountSelector value="" onChange={() => {}} excludeAccountId="1" />);

    await waitFor(() => {
      expect(screen.queryByText(/Checking Account/)).not.toBeInTheDocument();
      expect(screen.getByText(/Savings Account/)).toBeInTheDocument();
    });
  });

  it('displays error message on failure', async () => {
    (accountService.getAll as jest.Mock).mockRejectedValue(
      new Error('Failed to load accounts')
    );

    render(<AccountSelector value="" onChange={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load accounts')).toBeInTheDocument();
    });
  });
});
