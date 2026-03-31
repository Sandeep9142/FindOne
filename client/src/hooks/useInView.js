import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * IntersectionObserver hook for scroll reveal animations.
 *
 * @example
 * const [ref, isVisible] = useInView({ threshold: 0.2 });
 * <div ref={ref} className={isVisible ? 'animate-fade-up' : 'opacity-0'} />
 */
export function useInView(options = {}) {
  const { threshold = 0.1, rootMargin = '0px', once = true } = options;
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const callbackRef = useCallback(
    (node) => {
      ref.current = node;
    },
    []
  );

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(element);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return [callbackRef, isVisible];
}
