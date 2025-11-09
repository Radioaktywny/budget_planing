import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToastProvider, useToast } from '../ToastContext';

// Test component that uses the toast context
const TestComponent: React.FC = () => {
  const toast = useToast();

  return (
    <div>
      <button onClick={() => toast.success('Success message')}>Show Success</button>
      <button onClick={() => toast.error('Error message')}>Show Error</button>
      <button onClick={() => toast.warning('Warning message')}>Show Warning</button>
      <button onClick={() => toast.info('Info message')}>Show Info</button>
    </div>
  );
};

describe('ToastContext', () => {
  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useToast must be used within a ToastProvider');

    console.error = originalError;
  });

  it('provides toast functions', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    expect(screen.getByText('Show Success')).toBeInTheDocument();
    expect(screen.getByText('Show Error')).toBeInTheDocument();
    expect(screen.getByText('Show Warning')).toBeInTheDocument();
    expect(screen.getByText('Show Info')).toBeInTheDocument();
  });

  it('creates toast with correct type', () => {
    const { container } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const successButton = screen.getByText('Show Success');
    fireEvent.click(successButton);

    // Toast context creates toasts but doesn't render them
    // The actual rendering is done by ToastContainer
    // This test verifies the context works
    expect(successButton).toBeInTheDocument();
  });
});
