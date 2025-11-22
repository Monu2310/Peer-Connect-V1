const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// Performance optimization middleware
const performanceMiddleware = (app) => {
  // Enable gzip compression
  app.use(compression({
    level: 6, // Compression level (0-9)
    threshold: 1024, // Only compress responses larger than 1kb
    filter: (req, res) => {
      // Don't compress if the request includes a cache-control no-transform directive
      if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
        return false;
      }
      // Use compression filter function
      return compression.filter(req, res);
    }
  }));

  // Security headers with helmet
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for now to avoid conflicts
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" } // Allow cross-origin requests
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // Slow down repeated requests
  const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // Allow 50 requests per 15 minutes at full speed
    delayMs: 100, // Slow down subsequent requests by 100ms per request
    maxDelayMs: 5000, // Maximum delay of 5 seconds
  });
  app.use(speedLimiter);

  // Cache control headers
  app.use((req, res, next) => {
    // Set cache headers for static assets
    if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    } else if (req.url.startsWith('/api/')) {
      // API responses should not be cached by default
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    next();
  });

  // Request timing middleware
  app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
      
      // Log slow requests (>1s)
      if (duration > 1000) {
        console.warn(`Slow request detected: ${req.method} ${req.url} took ${duration}ms`);
      }
    });
    
    next();
  });

  // Memory usage monitoring
  const logMemoryUsage = () => {
    const usage = process.memoryUsage();
    const formatBytes = (bytes) => (bytes / 1024 / 1024).toFixed(2) + ' MB';
    
    console.log('Memory Usage:', {
      rss: formatBytes(usage.rss),
      heapTotal: formatBytes(usage.heapTotal),
      heapUsed: formatBytes(usage.heapUsed),
      external: formatBytes(usage.external)
    });
  };

  // Log memory usage every 5 minutes
  setInterval(logMemoryUsage, 5 * 60 * 1000);

  // Graceful shutdown handling
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
  });
};

// Database query optimization middleware
const optimizeQueries = () => {
  const mongoose = require('mongoose');
  
  // Log slow queries
  mongoose.set('debug', (collectionName, method, query, doc) => {
    const start = Date.now();
    console.log(`MongoDB Query: ${collectionName}.${method}`, query);
    
    // You can add timing logic here if needed
    process.nextTick(() => {
      const end = Date.now();
      if (end - start > 100) { // Log queries taking more than 100ms
        console.warn(`Slow query detected: ${collectionName}.${method} took ${end - start}ms`);
      }
    });
  });

  // Connection pool optimization
  mongoose.connection.on('connected', () => {
    console.log('MongoDB connection pool ready');
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
  });
};

// API response optimization
const optimizeApiResponses = (app) => {
  // JSON response optimization
  app.set('json spaces', 0); // Remove pretty printing in production
  
  // ETag support for caching
  app.set('etag', 'strong');
  
  // Trust proxy for correct IP addresses behind reverse proxy
  app.set('trust proxy', 1);
  
  // Optimize JSON parsing - REMOVED as it causes issues with undefined bodies
  // app.use((req, res, next) => {
  //   if (req.is('application/json')) {
  //     req.body = JSON.parse(JSON.stringify(req.body));
  //   }
  //   next();
  // });
};

module.exports = {
  performanceMiddleware,
  optimizeQueries,
  optimizeApiResponses
};