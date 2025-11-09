import { useState, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import { formatApiError } from '../services/api';

interface UseAsyncOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
}

interface UseAsyncReturn<T> {
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T | undefined>;
  reset: () => void;
}

export function useAsync<T = any>(
  asyncFunction: (...args: any[]) => Promise<T>,
  options: UseAsyncOptions = {}
): UseAsyncReturn<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const {
    onSuccess,
    onError,
    showSuccessToast = false,
    showErrorToast = true,
    successMessage,
  } = options;

  const execute = useCallback(
    async (...args: any[]): Promise<T | undefined> => {
      setLoading(true);
      setError(null);

      try {
        const result = await asyncFunction(...args);
        
        if (showSuccessToast && successMessage) {
          toast.success(successMessage);
        }
        
        if (onSuccess) {
          onSuccess(result);
        }
        
        setLoading(false);
        return result;
      } catch (err: any) {
        const errorMessage = formatApiError(err);
        setError(errorMessage);
        
        if (showErrorToast) {
          toast.error(errorMessage);
        }
        
        if (onError) {
          onError(err);
        }
        
        setLoading(false);
        return undefined;
      }
    },
    [asyncFunction, onSuccess, onError, showSuccessToast, showErrorToast, successMessage, toast]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return { loading, error, execute, reset };
}
