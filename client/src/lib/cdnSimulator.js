// CDN simulation and static asset optimization
class CDNSimulator {
  constructor() {
    this.assetCache = new Map();
    this.preloadQueue = [];
    this.optimizedAssets = new Map();
    this.cdnEndpoints = [
      'https://cdn.jsdelivr.net',
      'https://unpkg.com',
      'https://cdnjs.cloudflare.com'
    ];
    this.compressionFormats = ['avif', 'webp', 'jpg', 'png'];
    
    this.init();
  }

  init() {
    this.setupIntersectionObserver();
    this.preloadCriticalAssets();
    this.optimizeImages();
    this.setupServiceWorkerCaching();
  }

  // Preload critical assets immediately
  preloadCriticalAssets() {
    const criticalAssets = [
      // Critical CSS
      { type: 'style', href: '/static/css/main.css', priority: 'high' },
      
      // Critical fonts
      { type: 'font', href: '/fonts/inter-var.woff2', format: 'woff2', priority: 'high' },
      
      // Critical images
      { type: 'image', href: '/logo192.png', priority: 'high' },
      { type: 'image', href: '/favicon.ico', priority: 'high' },
      
      // Important scripts
      { type: 'script', href: '/static/js/vendor-chunk.js', priority: 'high' },
      { type: 'script', href: '/static/js/main-chunk.js', priority: 'high' }
    ];

    criticalAssets.forEach(asset => {
      this.preloadAsset(asset);
    });
  }

  // Intelligent asset preloading
  preloadAsset(asset) {
    const { type, href, priority = 'low', format } = asset;
    
    // Check if already preloaded
    if (this.assetCache.has(href)) {
      return Promise.resolve(this.assetCache.get(href));
    }

    return new Promise((resolve, reject) => {
      let element;

      switch (type) {
        case 'style':
          element = document.createElement('link');
          element.rel = 'preload';
          element.as = 'style';
          element.href = href;
          element.onload = () => {
            // Convert to actual stylesheet
            element.rel = 'stylesheet';
            this.assetCache.set(href, element);
            resolve(element);
          };
          break;

        case 'script':
          element = document.createElement('link');
          element.rel = 'preload';
          element.as = 'script';
          element.href = href;
          element.onload = () => {
            this.assetCache.set(href, element);
            resolve(element);
          };
          break;

        case 'image':
          element = new Image();
          element.src = this.getOptimizedImageUrl(href);
          element.onload = () => {
            this.assetCache.set(href, element);
            resolve(element);
          };
          break;

        case 'font':
          element = document.createElement('link');
          element.rel = 'preload';
          element.as = 'font';
          element.type = `font/${format}`;
          element.href = href;
          element.crossOrigin = 'anonymous';
          element.onload = () => {
            this.assetCache.set(href, element);
            resolve(element);
          };
          break;

        default:
          reject(new Error(`Unknown asset type: ${type}`));
          return;
      }

      element.onerror = () => {
        console.warn(`Failed to preload asset: ${href}`);
        reject(new Error(`Failed to preload: ${href}`));
      };

      // Set priority
      if (element.fetchPriority) {
        element.fetchPriority = priority;
      }

      document.head.appendChild(element);
    });
  }

  // Image optimization with modern formats
  getOptimizedImageUrl(src) {
    // Check if browser supports modern formats
    const supportsAVIF = this.supportsImageFormat('avif');
    const supportsWebP = this.supportsImageFormat('webp');
    
    let optimizedSrc = src;
    
    if (supportsAVIF && !src.includes('.avif')) {
      optimizedSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.avif');
    } else if (supportsWebP && !src.includes('.webp')) {
      optimizedSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }

    // Add responsive sizing parameters
    const url = new URL(optimizedSrc, window.location.origin);
    
    // Add compression and quality parameters
    url.searchParams.set('q', '85'); // Quality
    url.searchParams.set('f', 'auto'); // Format auto-detection
    
    return url.toString();
  }

  // Check browser support for image formats
  supportsImageFormat(format) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    try {
      return canvas.toDataURL(`image/${format}`).indexOf(`data:image/${format}`) === 0;
    } catch (e) {
      return false;
    }
  }

  // Lazy loading with Intersection Observer
  setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) {
      // Fallback for older browsers
      this.fallbackLazyLoading();
      return;
    }

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          this.loadLazyImage(img);
          imageObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px', // Start loading 50px before image enters viewport
      threshold: 0.01
    });

    // Observe all lazy images
    document.addEventListener('DOMContentLoaded', () => {
      const lazyImages = document.querySelectorAll('img[data-src], img[loading="lazy"]');
      lazyImages.forEach(img => imageObserver.observe(img));
    });

    // Re-observe dynamically added images
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeName === 'IMG' && (node.dataset.src || node.loading === 'lazy')) {
            imageObserver.observe(node);
          }
          if (node.querySelectorAll) {
            const lazyImages = node.querySelectorAll('img[data-src], img[loading="lazy"]');
            lazyImages.forEach(img => imageObserver.observe(img));
          }
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  loadLazyImage(img) {
    if (img.dataset.src) {
      img.src = this.getOptimizedImageUrl(img.dataset.src);
      img.removeAttribute('data-src');
    }
    
    img.classList.add('loaded');
  }

  fallbackLazyLoading() {
    // Simple scroll-based lazy loading for older browsers
    let lazyImages = Array.from(document.querySelectorAll('img[data-src]'));
    
    const lazyImageLoad = () => {
      lazyImages.forEach((img, index) => {
        const imageTop = img.offsetTop;
        const imageHeight = img.offsetHeight;
        const windowTop = window.scrollY;
        const windowHeight = window.innerHeight;
        
        if (imageTop < windowTop + windowHeight + 50) {
          this.loadLazyImage(img);
          lazyImages.splice(index, 1);
        }
      });
      
      if (lazyImages.length === 0) {
        window.removeEventListener('scroll', lazyImageLoad);
      }
    };
    
    window.addEventListener('scroll', lazyImageLoad);
    lazyImageLoad(); // Check initial viewport
  }

  // Progressive image loading
  loadProgressiveImage(container, src, placeholder = null) {
    const img = new Image();
    const placeholderSrc = placeholder || this.generatePlaceholder(200, 150);
    
    // Show placeholder immediately
    container.innerHTML = `<img src="${placeholderSrc}" class="placeholder" alt="Loading...">`;
    
    // Load optimized image
    img.onload = () => {
      img.classList.add('loaded');
      container.innerHTML = '';
      container.appendChild(img);
    };
    
    img.src = this.getOptimizedImageUrl(src);
    img.alt = container.getAttribute('data-alt') || '';
    
    return img;
  }

  generatePlaceholder(width, height, color = '#f0f0f0') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    
    // Add loading text
    ctx.fillStyle = '#999';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Loading...', width / 2, height / 2);
    
    return canvas.toDataURL();
  }

  // Resource hints for improved performance
  addResourceHints() {
    const hints = [
      // DNS prefetch for external domains
      { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
      { rel: 'dns-prefetch', href: '//cdn.jsdelivr.net' },
      
      // Preconnect to critical origins
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true },
      
      // Prefetch likely navigation targets
      { rel: 'prefetch', href: '/dashboard' },
      { rel: 'prefetch', href: '/activities' }
    ];

    hints.forEach(hint => {
      const link = document.createElement('link');
      Object.assign(link, hint);
      document.head.appendChild(link);
    });
  }

  // Service Worker caching strategies
  setupServiceWorkerCaching() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('🔧 Service Worker registered successfully');
          
          // Update cache strategies
          this.updateCacheStrategies(registration);
        })
        .catch(error => {
          console.warn('Service Worker registration failed:', error);
        });
    }
  }

  updateCacheStrategies(registration) {
    // Send cache strategy updates to service worker
    if (registration.active) {
      registration.active.postMessage({
        type: 'UPDATE_CACHE_STRATEGIES',
        strategies: {
          images: { strategy: 'cache-first', maxAge: 30 * 24 * 60 * 60 }, // 30 days
          fonts: { strategy: 'cache-first', maxAge: 365 * 24 * 60 * 60 }, // 1 year
          api: { strategy: 'network-first', maxAge: 5 * 60 }, // 5 minutes
          static: { strategy: 'stale-while-revalidate', maxAge: 24 * 60 * 60 } // 1 day
        }
      });
    }
  }

  // Predictive prefetching based on user behavior
  setupPredictivePrefetching() {
    let mouseOverTimer;
    const prefetchDelay = 100; // ms
    
    document.addEventListener('mouseover', (e) => {
      const link = e.target.closest('a');
      if (link && link.href && link.hostname === window.location.hostname) {
        mouseOverTimer = setTimeout(() => {
          this.prefetchPage(link.href);
        }, prefetchDelay);
      }
    });
    
    document.addEventListener('mouseout', () => {
      if (mouseOverTimer) {
        clearTimeout(mouseOverTimer);
      }
    });

    // Touch device support
    document.addEventListener('touchstart', (e) => {
      const link = e.target.closest('a');
      if (link && link.href && link.hostname === window.location.hostname) {
        this.prefetchPage(link.href);
      }
    });
  }

  prefetchPage(url) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
    
    console.log(`🔮 Prefetching page: ${url}`);
  }

  // Asset compression and optimization
  optimizeImages() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      // Add decoding="async" for non-critical images
      if (!img.hasAttribute('decoding') && !img.classList.contains('critical')) {
        img.decoding = 'async';
      }
      
      // Add loading="lazy" for below-the-fold images
      if (!img.hasAttribute('loading') && this.isBelowFold(img)) {
        img.loading = 'lazy';
      }
    });
  }

  isBelowFold(element) {
    const rect = element.getBoundingClientRect();
    return rect.top > window.innerHeight;
  }

  // Performance monitoring
  getPerformanceMetrics() {
    if (!window.performance) return null;

    const navigation = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    
    return {
      // Navigation timing
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      
      // Paint timing
      firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime,
      firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime,
      
      // Resource timing
      resources: performance.getEntriesByType('resource').map(resource => ({
        name: resource.name,
        duration: resource.duration,
        size: resource.transferSize,
        type: resource.initiatorType
      })),
      
      // Cache statistics
      cacheHits: this.assetCache.size,
      optimizedAssets: this.optimizedAssets.size
    };
  }

  // Cleanup and memory management
  cleanup() {
    this.assetCache.clear();
    this.optimizedAssets.clear();
    this.preloadQueue = [];
  }
}

// Initialize CDN simulator
const cdnSimulator = new CDNSimulator();

export default cdnSimulator;