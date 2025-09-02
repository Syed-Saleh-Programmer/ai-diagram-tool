import { useCallback, useRef, useEffect, useState } from 'react';

/**
 * Hook for debouncing values
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for cancelling previous requests
 */
export function useRequestCancellation() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelPreviousRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const createNewRequest = useCallback(() => {
    cancelPreviousRequest();
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current;
  }, [cancelPreviousRequest]);

  useEffect(() => {
    return () => {
      cancelPreviousRequest();
    };
  }, [cancelPreviousRequest]);

  return { cancelPreviousRequest, createNewRequest };
}
