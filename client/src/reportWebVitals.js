import performanceMonitor from './lib/performanceMonitor';

const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
  
  // Initialize enhanced performance monitoring
  if (process.env.REACT_APP_PERFORMANCE_MONITORING === 'true') {
    // Monitor memory usage periodically
    setInterval(() => {
      performanceMonitor.monitorMemory();
    }, 30000); // Every 30 seconds
  }
};

export default reportWebVitals;
