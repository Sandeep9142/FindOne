import { useState, useEffect } from 'react';
import { BREAKPOINTS } from '@config/constants';

/**
 * Returns true if window width ≤ given breakpoint.
 * Defaults to 'md' (768px).
 *
 * @example const isMobile = useMediaQuery('md');
 */
export function useMediaQuery(breakpoint = 'md') {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const query = `(max-width: ${BREAKPOINTS[breakpoint] || 768}px)`;
    const mql = window.matchMedia(query);

    setMatches(mql.matches);

    const handler = (e) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [breakpoint]);

  return matches;
}
