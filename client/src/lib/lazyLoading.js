import { lazy, Suspense } from 'react';

// Lazy loading utility for React components
export const createLazyComponent = (importFunction, fallback = null) => {
  const LazyComponent = lazy(importFunction);
  
  return (props) => (
    <Suspense fallback={fallback || <div>Loading...</div>}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Preload component for better performance
export const preloadComponent = (importFunction) => {
  const componentImport = importFunction();
  return componentImport;
};

// Route-based lazy loading
export const createLazyRoute = (importFunction) => {
  return lazy(importFunction);
};

// Dynamic import with retry mechanism
export const dynamicImport = async (importFunction, retries = 3) => {
  try {
    return await importFunction();
  } catch (error) {
    if (retries > 0) {
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      return dynamicImport(importFunction, retries - 1);
    }
    throw error;
  }
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (callback, options = {}) => {
  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '50px',
    ...options,
  };

  return (element) => {
    if (!element) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback(entry);
          observer.unobserve(entry.target);
        }
      });
    }, defaultOptions);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  };
};