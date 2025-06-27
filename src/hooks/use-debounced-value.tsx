import { useState, useEffect } from 'react';

interface UseDebouncedValueOptions {
  delay: number;
  leading?: boolean;
  trailing?: boolean;
}

/**
 * Hook that debounces a value, delaying updates until after the specified delay
 * has elapsed since the last time the value changed.
 *
 * @param value - The value to debounce
 * @param delay - The number of milliseconds to delay
 * @param options - Additional options for debouncing behavior
 * @returns The debounced value
 */
export function useDebouncedValue<T>(
  value: T,
  delay: number,
  options: Partial<UseDebouncedValueOptions> = {}
): T {
  const { leading = false, trailing = true } = options;
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // If leading is true, immediately update on first change
    if (leading && debouncedValue !== value) {
      setDebouncedValue(value);
      return;
    }

    // Set up the timer for trailing update
    const timer = setTimeout(() => {
      if (trailing) {
        setDebouncedValue(value);
      }
    }, delay);

    // Cleanup function to clear the timer
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay, leading, trailing, debouncedValue]);

  return debouncedValue;
}

/**
 * Hook that debounces a callback function, ensuring it's only called after
 * the specified delay has elapsed since the last invocation attempt.
 *
 * @param callback - The callback function to debounce
 * @param delay - The number of milliseconds to delay
 * @param deps - Dependency array for the callback
 * @returns The debounced callback function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const [debouncedCallback] = useState(() => {
    let timeoutId: NodeJS.Timeout;

    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T;
  });

  useEffect(() => {
    // Update the callback reference when dependencies change
    return () => {
      // Cleanup any pending timeouts when dependencies change
    };
  }, [callback, delay, ...deps]);

  return debouncedCallback;
}

/**
 * Hook that provides both immediate and debounced values for performance optimization
 * Useful for scenarios where you need immediate UI feedback but want to debounce
 * expensive operations like API calls.
 *
 * @param value - The value to track
 * @param delay - The debounce delay in milliseconds
 * @returns Object containing both immediate and debounced values
 */
export function useImmediateAndDebouncedValue<T>(
  value: T,
  delay: number
): {
  immediate: T;
  debounced: T;
  isPending: boolean;
} {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (value === debouncedValue) {
      setIsPending(false);
      return;
    }

    setIsPending(true);

    const timer = setTimeout(() => {
      setDebouncedValue(value);
      setIsPending(false);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay, debouncedValue]);

  return {
    immediate: value,
    debounced: debouncedValue,
    isPending,
  };
}
