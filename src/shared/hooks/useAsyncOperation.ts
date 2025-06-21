import { useState, useCallback } from 'react';
import { ErrorHandler, type ErrorContext } from '../utils/errorHandler';

/**
 * Hook for handling async operations with consistent error handling
 * Follows the Single Responsibility Principle for async state management
 */
export function useAsyncOperation<T>(context: ErrorContext) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (
    operation: () => Promise<T>,
    onSuccess?: (data: T) => void,
    onError?: (error: string) => void
  ): Promise<T | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await operation();
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const errorMessage = ErrorHandler.handle(err as Error, context);
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    execute,
    clearError
  };
}