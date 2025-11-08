import { useState, useEffect, useRef, useCallback } from 'react';

// Hook for optimizing re-renders
export const useOptimizedState = (initialValue) => {
  const [state, setState] = useState(initialValue);
  const stateRef = useRef(state);
  
  const setOptimizedState = useCallback((newValue) => {
    if (typeof newValue === 'function') {
      const result = newValue(stateRef.current);
      if (result !== stateRef.current) {
        stateRef.current = result;
        setState(result);
      }
    } else if (newValue !== stateRef.current) {
      stateRef.current = newValue;
      setState(newValue);
    }
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  return [state, setOptimizedState];
};

// Hook for debouncing values
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook for throttling function calls
export const useThrottle = (callback, delay) => {
  const lastRun = useRef(Date.now());

  return useCallback((...args) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]);
};

// Hook for memoizing expensive calculations
export const useMemoizedValue = (factory, deps) => {
  const memoRef = useRef();
  const depsRef = useRef();

  if (!depsRef.current || !deps.every((dep, index) => dep === depsRef.current[index])) {
    memoRef.current = factory();
    depsRef.current = deps;
  }

  return memoRef.current;
};

// Hook for virtual scrolling
export const useVirtualScrolling = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    items.length
  );

  const visibleItems = items.slice(visibleStart, visibleEnd).map((item, index) => ({
    ...item,
    index: visibleStart + index
  }));

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e) => setScrollTop(e.target.scrollTop)
  };
};

// Hook for intersection observer
export const useIntersectionObserver = (options = {}) => {
  const [entry, setEntry] = useState(null);
  const [node, setNode] = useState(null);

  const observer = useRef(null);

  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(([entry]) => {
      setEntry(entry);
    }, options);

    const currentObserver = observer.current;

    if (node) currentObserver.observe(node);

    return () => {
      if (currentObserver) currentObserver.disconnect();
    };
  }, [node, options]);

  return [setNode, entry];
};

// Hook for prefetching data
export const usePrefetch = (fetchFunction, shouldPrefetch = true) => {
  const [isPrefetched, setIsPrefetched] = useState(false);
  const prefetchedData = useRef(null);

  useEffect(() => {
    if (shouldPrefetch && !isPrefetched) {
      fetchFunction().then((data) => {
        prefetchedData.current = data;
        setIsPrefetched(true);
      });
    }
  }, [fetchFunction, shouldPrefetch, isPrefetched]);

  return {
    isPrefetched,
    data: prefetchedData.current
  };
};

// Hook for optimized animations
export const useOptimizedAnimation = (duration = 300) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const rafRef = useRef();

  const startAnimation = useCallback(() => {
    setIsAnimating(true);
    
    const start = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };
    
    rafRef.current = requestAnimationFrame(animate);
  }, [duration]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return { isAnimating, startAnimation };
};
