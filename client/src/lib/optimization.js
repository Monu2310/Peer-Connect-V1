import React, { useCallback, useMemo } from 'react';

/**
 * HOC to memoize components and optimize re-renders
 */
export const withPerformance = (Component, dependencies = []) => {
  return React.memo(Component, (prevProps, nextProps) => {
    // Custom comparison for specific dependencies
    if (dependencies.length === 0) {
      return true; // Always re-render if no dependencies specified
    }
    
    // Check if any dependency changed
    return dependencies.every(dep => prevProps[dep] === nextProps[dep]);
  });
};

/**
 * Debounce hook for search, resize, scroll events
 */
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Throttle hook for high-frequency events
 */
export const useThrottle = (callback, delay = 300) => {
  const lastRun = React.useRef(Date.now());

  return useCallback((...args) => {
    const now = Date.now();
    if (now - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = now;
    }
  }, [callback, delay]);
};

/**
 * Infinite scroll hook with virtual scrolling support
 */
export const useInfiniteScroll = (callback, threshold = 100) => {
  const observerTarget = React.useRef(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      {
        rootMargin: `${threshold}px`
      }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [callback, threshold]);

  return observerTarget;
};

/**
 * Image lazy loading hook
 */
export const useLazyImage = (imageUrl, placeholderUrl = null) => {
  const [imageSrc, setImageSrc] = React.useState(placeholderUrl);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const img = new Image();
    
    img.onload = () => {
      setImageSrc(imageUrl);
      setIsLoading(false);
    };
    
    img.onerror = () => {
      setIsLoading(false);
    };
    
    img.src = imageUrl;
  }, [imageUrl]);

  return { imageSrc, isLoading };
};

/**
 * Local storage hook with optimization
 */
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = React.useState(() => {
    try {
      const item = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = useCallback(value => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.log(error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
};

/**
 * Batch API calls for better performance
 */
export const batchRequests = (requests, batchSize = 5) => {
  return new Promise((resolve, reject) => {
    const results = [];
    let completed = 0;
    
    const processBatch = (batch, batchIndex) => {
      Promise.all(batch).then(batchResults => {
        results.push(...batchResults.map((result, i) => ({
          result,
          index: batchIndex * batchSize + i
        })));
        completed++;
        
        if (completed === Math.ceil(requests.length / batchSize)) {
          resolve(results.sort((a, b) => a.index - b.index).map(r => r.result));
        }
      }).catch(reject);
    };
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      processBatch(batch, Math.floor(i / batchSize));
    }
  });
};
