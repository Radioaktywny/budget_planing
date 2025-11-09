import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { useAsync } from '../hooks/useAsync';
import LoadingSpinner, { LoadingOverlay, ButtonSpinner } from '../components/LoadingSpinner';

/**
 * Demo page showing all error handling and loading state features
 * This is for development/testing purposes only
 */
const ErrorHandlingDemo: React.FC = () => {
  const toast = useToast();
  const [showOverlay, setShowOverlay] = useState(false);
  const [throwError, setThrowError] = useState(false);

  // Simulate async operation
  const simulateAsync = useAsync(
    async (shouldFail: boolean) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      if (shouldFail) {
        throw new Error('Simulated error');
      }
      return 'Success!';
    },
    {
      showSuccessToast: true,
      successMessage: 'Operation completed successfully!',
      showErrorToast: true,
    }
  );

  // Component that throws error for ErrorBoundary demo
  if (throwError) {
    throw new Error('Demo error for ErrorBoundary');
  }

  const handleShowOverlay = () => {
    setShowOverlay(true);
    setTimeout(() => setShowOverlay(false), 3000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Error Handling & Loading States Demo
      </h1>

      {/* Toast Notifications */}
      <section className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Toast Notifications</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => toast.success('Success message!')}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Success Toast
          </button>
          <button
            onClick={() => toast.error('Error message!')}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Error Toast
          </button>
          <button
            onClick={() => toast.warning('Warning message!')}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Warning Toast
          </button>
          <button
            onClick={() => toast.info('Info message!')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Info Toast
          </button>
        </div>
      </section>

      {/* Loading Spinners */}
      <section className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Loading Spinners</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Sizes:</h3>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <LoadingSpinner size="sm" />
                <p className="text-xs text-gray-500 mt-2">Small</p>
              </div>
              <div className="text-center">
                <LoadingSpinner size="md" />
                <p className="text-xs text-gray-500 mt-2">Medium</p>
              </div>
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="text-xs text-gray-500 mt-2">Large</p>
              </div>
              <div className="text-center">
                <LoadingSpinner size="xl" />
                <p className="text-xs text-gray-500 mt-2">Extra Large</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">With Text:</h3>
            <LoadingSpinner size="md" text="Loading data..." />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Button Spinner:</h3>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <ButtonSpinner />
              <span>Processing...</span>
            </button>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Full Page Overlay:</h3>
            <button
              onClick={handleShowOverlay}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Show Loading Overlay (3s)
            </button>
          </div>
        </div>
      </section>

      {/* useAsync Hook */}
      <section className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">useAsync Hook</h2>
        <div className="space-y-4">
          <div className="flex gap-3">
            <button
              onClick={() => simulateAsync.execute(false)}
              disabled={simulateAsync.loading}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {simulateAsync.loading ? (
                <>
                  <ButtonSpinner />
                  <span>Loading...</span>
                </>
              ) : (
                'Simulate Success'
              )}
            </button>
            <button
              onClick={() => simulateAsync.execute(true)}
              disabled={simulateAsync.loading}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {simulateAsync.loading ? (
                <>
                  <ButtonSpinner />
                  <span>Loading...</span>
                </>
              ) : (
                'Simulate Error'
              )}
            </button>
          </div>
          {simulateAsync.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              Error: {simulateAsync.error}
            </div>
          )}
        </div>
      </section>

      {/* Error Boundary */}
      <section className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Error Boundary</h2>
        <p className="text-gray-600 mb-4">
          Click the button below to throw an error and see the ErrorBoundary in action.
          The entire app will show an error screen with recovery options.
        </p>
        <button
          onClick={() => setThrowError(true)}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Throw Error (Test ErrorBoundary)
        </button>
      </section>

      {/* API Retry Logic */}
      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">API Retry Logic</h2>
        <p className="text-gray-600 mb-4">
          The API client automatically retries failed requests up to 3 times with exponential
          backoff. Network errors and server errors (500, 502, 503, 504) are automatically
          retried.
        </p>
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
          <p className="font-medium">Retry Configuration:</p>
          <ul className="list-disc list-inside mt-2 text-sm">
            <li>Max retries: 3</li>
            <li>Initial delay: 1 second</li>
            <li>Backoff: Exponential (1s, 2s, 4s)</li>
            <li>Retry on: Network errors, 408, 429, 500, 502, 503, 504</li>
          </ul>
        </div>
      </section>

      {showOverlay && <LoadingOverlay text="Processing your request..." />}
    </div>
  );
};

export default ErrorHandlingDemo;
