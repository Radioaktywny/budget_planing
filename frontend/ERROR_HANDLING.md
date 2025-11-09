# Error Handling and Loading States

This document describes the error handling and loading state management system implemented in the Home Budget Manager frontend.

## Components

### 1. ErrorBoundary

A React error boundary component that catches JavaScript errors anywhere in the component tree and displays a fallback UI.

**Location:** `src/components/ErrorBoundary.tsx`

**Usage:**
```tsx
import ErrorBoundary from './components/ErrorBoundary';

<ErrorBoundary>
  <YourApp />
</ErrorBoundary>
```

**Features:**
- Catches unhandled errors in child components
- Displays user-friendly error message
- Shows error details in development
- Provides "Try Again" and "Go Home" buttons
- Logs errors to console for debugging

### 2. Toast Notification System

A context-based toast notification system for displaying temporary messages to users.

**Location:** 
- Context: `src/contexts/ToastContext.tsx`
- Component: `src/components/ToastContainer.tsx`

**Usage:**
```tsx
import { useToast } from '../contexts/ToastContext';

const MyComponent = () => {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success('Operation completed successfully!');
  };

  const handleError = () => {
    toast.error('Something went wrong');
  };

  const handleWarning = () => {
    toast.warning('Please review your input');
  };

  const handleInfo = () => {
    toast.info('New feature available');
  };

  return (
    <button onClick={handleSuccess}>Show Toast</button>
  );
};
```

**Toast Types:**
- `success` - Green toast for successful operations
- `error` - Red toast for errors
- `warning` - Yellow toast for warnings
- `info` - Blue toast for informational messages

**Features:**
- Auto-dismiss after 5 seconds (configurable)
- Manual dismiss with close button
- Slide-in animation
- Multiple toasts stack vertically
- Positioned at top-right of screen

### 3. Loading Spinner

Reusable loading spinner components for different use cases.

**Location:** `src/components/LoadingSpinner.tsx`

**Usage:**

**Basic Spinner:**
```tsx
import LoadingSpinner from '../components/LoadingSpinner';

<LoadingSpinner size="md" text="Loading..." />
```

**Full Page Overlay:**
```tsx
import { LoadingOverlay } from '../components/LoadingSpinner';

{isLoading && <LoadingOverlay text="Processing..." />}
```

**Button Spinner:**
```tsx
import { ButtonSpinner } from '../components/LoadingSpinner';

<button disabled={loading}>
  {loading ? <ButtonSpinner /> : 'Submit'}
</button>
```

**Sizes:**
- `sm` - Small (16px)
- `md` - Medium (32px) - default
- `lg` - Large (48px)
- `xl` - Extra Large (64px)

### 4. useAsync Hook

A custom hook for handling async operations with loading and error states.

**Location:** `src/hooks/useAsync.ts`

**Usage:**
```tsx
import { useAsync } from '../hooks/useAsync';

const MyComponent = () => {
  const saveData = useAsync(
    async (data) => {
      return await apiService.save(data);
    },
    {
      showSuccessToast: true,
      successMessage: 'Data saved successfully',
      showErrorToast: true,
      onSuccess: (result) => {
        console.log('Success:', result);
      },
      onError: (error) => {
        console.error('Error:', error);
      },
    }
  );

  const handleSave = async () => {
    const result = await saveData.execute(myData);
    if (result) {
      // Handle success
    }
  };

  return (
    <button 
      onClick={handleSave} 
      disabled={saveData.loading}
    >
      {saveData.loading ? 'Saving...' : 'Save'}
    </button>
  );
};
```

**Options:**
- `showSuccessToast` - Show success toast on completion
- `successMessage` - Custom success message
- `showErrorToast` - Show error toast on failure (default: true)
- `onSuccess` - Callback on success
- `onError` - Callback on error

**Returns:**
- `loading` - Boolean indicating if operation is in progress
- `error` - Error message string or null
- `execute` - Function to execute the async operation
- `reset` - Function to reset loading and error states

## API Error Handling

### Enhanced API Client

The API client (`src/services/api.ts`) includes:

**Retry Logic:**
- Automatically retries failed requests up to 3 times
- Uses exponential backoff (1s, 2s, 4s)
- Retries on network errors and specific status codes (408, 429, 500, 502, 503, 504)

**User-Friendly Error Messages:**
- 400: "Invalid request. Please check your input."
- 401: "You are not authorized to perform this action."
- 403: "Access forbidden. You do not have permission."
- 404: "The requested resource was not found."
- 409: "A conflict occurred. This resource may already exist."
- 500: "A server error occurred. Please try again later."
- 503: "The service is temporarily unavailable. Please try again later."
- Network Error: "Unable to connect to server. Please check your internet connection."

**Error Formatting:**
```tsx
import { formatApiError } from '../services/api';

try {
  await apiCall();
} catch (error) {
  const message = formatApiError(error);
  toast.error(message);
}
```

## Best Practices

### 1. Always Use Error Boundaries

Wrap your app or major sections in ErrorBoundary:

```tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### 2. Show Loading States

Always show loading indicators for async operations:

```tsx
{loading ? (
  <LoadingSpinner size="lg" text="Loading data..." />
) : (
  <DataDisplay data={data} />
)}
```

### 3. Use Toast for User Feedback

Provide immediate feedback for user actions:

```tsx
const handleSave = async () => {
  try {
    await saveData();
    toast.success('Saved successfully!');
  } catch (error) {
    toast.error(formatApiError(error));
  }
};
```

### 4. Disable Buttons During Loading

Prevent duplicate submissions:

```tsx
<button 
  onClick={handleSubmit}
  disabled={loading}
  className="... disabled:opacity-50 disabled:cursor-not-allowed"
>
  {loading ? <ButtonSpinner /> : 'Submit'}
</button>
```

### 5. Use useAsync for Complex Operations

Simplify async state management:

```tsx
const operation = useAsync(
  async () => await apiCall(),
  {
    showSuccessToast: true,
    successMessage: 'Operation completed',
    showErrorToast: true,
  }
);

// In your component
await operation.execute();
```

### 6. Handle Field-Level Validation Errors

Display validation errors from the API:

```tsx
try {
  await apiCall();
} catch (error: any) {
  if (error.details && Array.isArray(error.details)) {
    error.details.forEach((detail: any) => {
      // Show field-specific errors
      setFieldError(detail.field, detail.message);
    });
  } else {
    toast.error(formatApiError(error));
  }
}
```

## Testing Error Handling

### Test Error Boundary

```tsx
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

const ThrowError = () => {
  throw new Error('Test error');
};

test('displays error UI when error is thrown', () => {
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );
  
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});
```

### Test Toast Notifications

```tsx
import { render, screen } from '@testing-library/react';
import { ToastProvider, useToast } from './contexts/ToastContext';

const TestComponent = () => {
  const toast = useToast();
  return <button onClick={() => toast.success('Test')}>Show</button>;
};

test('displays toast notification', async () => {
  render(
    <ToastProvider>
      <TestComponent />
    </ToastProvider>
  );
  
  fireEvent.click(screen.getByText('Show'));
  expect(await screen.findByText('Test')).toBeInTheDocument();
});
```

## Migration Guide

To add error handling to existing components:

1. **Import necessary utilities:**
```tsx
import { useToast } from '../contexts/ToastContext';
import { useAsync } from '../hooks/useAsync';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatApiError } from '../services/api';
```

2. **Replace manual error handling:**
```tsx
// Before
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const handleSave = async () => {
  try {
    setLoading(true);
    await apiCall();
    setError(null);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

// After
const toast = useToast();
const saveOperation = useAsync(
  async () => await apiCall(),
  {
    showSuccessToast: true,
    successMessage: 'Saved successfully',
  }
);

const handleSave = async () => {
  await saveOperation.execute();
};
```

3. **Update loading UI:**
```tsx
// Before
{loading && <div>Loading...</div>}

// After
{loading && <LoadingSpinner size="md" text="Loading..." />}
```

4. **Update button states:**
```tsx
// Before
<button onClick={handleSave}>Save</button>

// After
<button 
  onClick={handleSave}
  disabled={saveOperation.loading}
  className="... disabled:opacity-50"
>
  {saveOperation.loading ? <ButtonSpinner /> : 'Save'}
</button>
```

## Summary

The error handling system provides:
- ✅ Automatic error catching with ErrorBoundary
- ✅ User-friendly toast notifications
- ✅ Loading states for all async operations
- ✅ Automatic retry logic for failed requests
- ✅ Consistent error messages across the app
- ✅ Easy-to-use hooks and utilities
- ✅ Accessible and responsive UI components
