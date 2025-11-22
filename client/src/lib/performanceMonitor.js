import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.isEnabled = process.env.REACT_APP_PERFORMANCE_MONITORING === 'true';
    this.init();
  }

  init() {
    if (!this.isEnabled) return;

    // Core Web Vitals
    getCLS(this.handleMetric.bind(this, 'CLS'));
    getFID(this.handleMetric.bind(this, 'FID'));
    getFCP(this.handleMetric.bind(this, 'FCP'));
    getLCP(this.handleMetric.bind(this, 'LCP'));
    getTTFB(this.handleMetric.bind(this, 'TTFB'));
    
    // Interaction to Next Paint (new metric) - conditionally import if available
    this.loadINPIfAvailable();

    // Custom performance measurements
    this.measureCustomMetrics();
    
    // Monitor resource loading
    this.monitorResources();
    
    // Monitor long tasks
    this.monitorLongTasks();
  }

  async loadINPIfAvailable() {
    try {
      // Try to dynamically import getINP if it's available in a newer version
      const { getINP } = await import('web-vitals').catch(() => ({}));
      if (typeof getINP === 'function') {
        getINP(this.handleMetric.bind(this, 'INP'));
      }
    } catch (error) {
      // INP not available in current web-vitals version, skip it
      console.log('INP metric not available in current web-vitals version');
    }
  }

  handleMetric(name, metric) {
    this.metrics[name] = metric;
    
    // Log metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance metric ${name}:`, metric);
    }

    // Send to analytics in production (you can replace with your analytics service)
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(name, metric);
    }
  }

  measureCustomMetrics() {
    // Time to Interactive
    this.measureTTI();
    
    // First Input Delay
    this.measureFID();
    
    // Bundle size metrics
    this.measureBundleSize();
  }

  measureTTI() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const tti = entry.domInteractive - entry.fetchStart;
            this.handleMetric('TTI', { value: tti, name: 'TTI' });
          }
        }
      });
      observer.observe({ entryTypes: ['navigation'] });
    }
  }

  measureFID() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'first-input') {
            const fid = entry.processingStart - entry.startTime;
            this.handleMetric('FID_Custom', { value: fid, name: 'FID_Custom' });
          }
        }
      });
      observer.observe({ entryTypes: ['first-input'] });
    }
  }

  measureBundleSize() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        let totalJSSize = 0;
        let totalCSSSize = 0;
        
        for (const entry of list.getEntries()) {
          if (entry.name.includes('.js')) {
            totalJSSize += entry.transferSize || 0;
          } else if (entry.name.includes('.css')) {
            totalCSSSize += entry.transferSize || 0;
          }
        }
        
        this.handleMetric('Bundle_JS_Size', { value: totalJSSize, name: 'Bundle_JS_Size' });
        this.handleMetric('Bundle_CSS_Size', { value: totalCSSSize, name: 'Bundle_CSS_Size' });
      });
      observer.observe({ entryTypes: ['resource'] });
    }
  }

  monitorResources() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Monitor slow resources (>1s)
          if (entry.duration > 1000) {
            this.handleMetric('Slow_Resource', {
              name: 'Slow_Resource',
              value: entry.duration,
              resource: entry.name
            });
          }
          
          // Monitor large resources (>500kb)
          if (entry.transferSize > 512000) {
            this.handleMetric('Large_Resource', {
              name: 'Large_Resource',
              value: entry.transferSize,
              resource: entry.name
            });
          }
        }
      });
      observer.observe({ entryTypes: ['resource'] });
    }
  }

  monitorLongTasks() {
    if ('PerformanceObserver' in window && 'longtask' in PerformanceObserver.supportedEntryTypes) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handleMetric('Long_Task', {
            name: 'Long_Task',
            value: entry.duration,
            startTime: entry.startTime
          });
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    }
  }

  // Memory usage monitoring
  monitorMemory() {
    if ('memory' in performance) {
      const memInfo = performance.memory;
      this.handleMetric('Memory_Usage', {
        name: 'Memory_Usage',
        used: memInfo.usedJSHeapSize,
        total: memInfo.totalJSHeapSize,
        limit: memInfo.jsHeapSizeLimit
      });
    }
  }

  // API response time monitoring
  monitorApiCall(url, startTime, endTime, success = true) {
    const duration = endTime - startTime;
    this.handleMetric('API_Response_Time', {
      name: 'API_Response_Time',
      value: duration,
      url,
      success
    });
  }

  // Component render time monitoring
  monitorComponentRender(componentName, renderTime) {
    this.handleMetric('Component_Render_Time', {
      name: 'Component_Render_Time',
      component: componentName,
      value: renderTime
    });
  }

  sendToAnalytics(name, metric) {
    // Replace with your analytics service
    // Example: Google Analytics, Mixpanel, etc.
    
    // For now, just store in localStorage for debugging
    const existingData = JSON.parse(localStorage.getItem('performance_metrics') || '[]');
    existingData.push({
      name,
      metric,
      timestamp: Date.now(),
      url: window.location.href
    });
    
    // Keep only last 100 entries
    if (existingData.length > 100) {
      existingData.splice(0, existingData.length - 100);
    }
    
    localStorage.setItem('performance_metrics', JSON.stringify(existingData));
  }

  // Get performance summary
  getSummary() {
    return this.metrics;
  }

  // Clear metrics
  clear() {
    this.metrics = {};
    localStorage.removeItem('performance_metrics');
  }

	// Integrate CRA reportWebVitals callback
	recordWebVital(metric) {
		if (!metric || !metric.name) return;
		this.handleMetric(metric.name, metric);
	}
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// React hook for component-level performance monitoring
export const usePerformanceMonitor = (componentName) => {
  const startRender = () => {
    return performance.now();
  };

  const endRender = (startTime) => {
    const endTime = performance.now();
    performanceMonitor.monitorComponentRender(componentName, endTime - startTime);
  };

  const monitorApiCall = async (apiCall, url) => {
    const startTime = performance.now();
    try {
      const result = await apiCall();
      const endTime = performance.now();
      performanceMonitor.monitorApiCall(url, startTime, endTime, true);
      return result;
    } catch (error) {
      const endTime = performance.now();
      performanceMonitor.monitorApiCall(url, startTime, endTime, false);
      throw error;
    }
  };

  return {
    startRender,
    endRender,
    monitorApiCall
  };
};

export default performanceMonitor;
