import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImportReview, { ImportReviewTransaction } from '../ImportReview';
import { TransactionType } from '../../types';
import * as categoryService from '../../services/categoryService';
import * as accountService from '../../services/accountService';

// Mock the services
jest.mock('../../services/categoryService');
jest.mock('../../services/accountService');

const mockCategories = [
  { id: 'cat1', name: 'Food & Dining', userId: 'user1' },
  { id: 'cat2', name: 'Transportation', userId: 'user1' },
];

const mockAccounts = [
  { id: 'acc1', name: 'Checking Account', type: 'CHECKING', balance: 1000, userId: 'user1', createdAt: '', updatedAt: '' },
  { id: 'acc2', name: 'Savings Account', type: 'SAVINGS', balance: 5000, userId: 'user1', createdAt: '', updatedAt: '' },
];

const mockTransactions: ImportReviewTransaction[] = [
  {
    id: 'txn1',
    date: '2024-01-15',
    amount: 50.00,
    type: TransactionType.EXPENSE,
    description: 'Grocery Store',
    category: 'Food & Dining',
    categoryId: 'cat1',
    account: 'Checking Account',
    accountId: 'acc1',
    selected: true,
    expanded: false,
  },
  {
    id: 'txn2',
    date: '2024-01-16',
    amount: 100.00,
    type: TransactionType.EXPENSE,
    description: 'Gas Station',
    category: 'Transportation',
    categoryId: 'cat2',
    account: 'Checking Account',
    accountId: 'acc1',
    selected: true,
    expanded: false,
  },
];

describe('ImportReview Component', () => {
  beforeEach(() => {
    (categoryService.categoryService.getAll as jest.Mock).mockResolvedValue(mockCategories);
    (accountService.accountService.getAll as jest.Mock).mockResolvedValue(mockAccounts);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders transaction review table', async () => {
    const mockOnApprove = jest.fn();
    const mockOnCancel = jest.fn();

    render(
      <ImportReview
        transactions={mockTransactions}
        onApprove={mockOnApprove}
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Review Transactions')).toBeInTheDocument();
    });

    expect(screen.getByText('Grocery Store')).toBeInTheDocument();
    expect(screen.getByText('Gas Station')).toBeInTheDocument();
  });

  test('allows selecting and deselecting transactions', async () => {
    const mockOnApprove = jest.fn();
    const mockOnCancel = jest.fn();

    render(
      <ImportReview
        transactions={mockTransactions}
        onApprove={mockOnApprove}
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Review Transactions')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);

    // First checkbox is "select all"
    const selectAllCheckbox = checkboxes[0];
    expect(selectAllCheckbox).toBeChecked();

    // Uncheck select all
    fireEvent.click(selectAllCheckbox);
    expect(selectAllCheckbox).not.toBeChecked();
  });

  test('calls onApprove with selected transactions', async () => {
    const mockOnApprove = jest.fn();
    const mockOnCancel = jest.fn();

    render(
      <ImportReview
        transactions={mockTransactions}
        onApprove={mockOnApprove}
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Review Transactions')).toBeInTheDocument();
    });

    const approveAllButton = screen.getByText('Approve All');
    fireEvent.click(approveAllButton);

    expect(mockOnApprove).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'txn1' }),
        expect.objectContaining({ id: 'txn2' }),
      ])
    );
  });

  test('calls onCancel when cancel button is clicked', async () => {
    const mockOnApprove = jest.fn();
    const mockOnCancel = jest.fn();

    render(
      <ImportReview
        transactions={mockTransactions}
        onApprove={mockOnApprove}
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Review Transactions')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  test('displays warnings when provided', async () => {
    const mockOnApprove = jest.fn();
    const mockOnCancel = jest.fn();
    const warnings = ['Account "Unknown Account" not found'];

    render(
      <ImportReview
        transactions={mockTransactions}
        warnings={warnings}
        onApprove={mockOnApprove}
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Warnings')).toBeInTheDocument();
    });

    expect(screen.getByText('Account "Unknown Account" not found')).toBeInTheDocument();
  });

  test('allows converting transaction to split', async () => {
    const mockOnApprove = jest.fn();
    const mockOnCancel = jest.fn();

    render(
      <ImportReview
        transactions={mockTransactions}
        onApprove={mockOnApprove}
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Review Transactions')).toBeInTheDocument();
    });

    const splitButtons = screen.getAllByText('Split Transaction');
    expect(splitButtons.length).toBeGreaterThan(0);

    fireEvent.click(splitButtons[0]);

    // Should show "Convert to Regular" button after splitting
    await waitFor(() => {
      expect(screen.getByText('Convert to Regular')).toBeInTheDocument();
    });
  });
});
