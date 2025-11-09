import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner, { LoadingOverlay, ButtonSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default size', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('w-8', 'h-8');
  });

  it('renders with custom size', () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('w-12', 'h-12');
  });

  it('renders with text', () => {
    render(<LoadingSpinner text="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('renders without text', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector('p')).not.toBeInTheDocument();
  });
});

describe('LoadingOverlay', () => {
  it('renders with default text', () => {
    render(<LoadingOverlay />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom text', () => {
    render(<LoadingOverlay text="Processing..." />);
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });
});

describe('ButtonSpinner', () => {
  it('renders spinner', () => {
    const { container } = render(<ButtonSpinner />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});
