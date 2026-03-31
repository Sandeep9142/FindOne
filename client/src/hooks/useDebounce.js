import { useState, useEffect, useRef } from 'react';

/**
 * Debounced value hook — useful for search inputs.
 *
 * @example
 * const debouncedQuery = useDebounce(searchQuery, 400);
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timerRef.current);
  }, [value, delay]);

  return debounced;
}
