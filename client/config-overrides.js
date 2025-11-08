const { DefinePlugin } = require('webpack');
const CompressionPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = function override(config, env) {
  // Only apply optimizations in production
  if (env === 'production') {
    // Enable aggressive tree shaking
    config.optimization = {
      ...config.optimization,
      sideEffects: false,
      usedExports: true,
      minimize: true,
      concatenateModules: true,
      minimizer: [
        new TerserPlugin({
          parallel: true,
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
              passes: 2,
            },
            mangle: {
              safari10: true,
            },
            format: {
              comments: false,
            },
          },
          extractComments: false,
        }),
      ],
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: 30,
        maxAsyncRequests: 30,
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          // Core React - highest priority
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 100,
            enforce: true,
            reuseExistingChunk: true,
          },
          // Router
          router: {
            test: /[\\/]node_modules[\\/](react-router|react-router-dom)[\\/]/,
            name: 'router',
            chunks: 'all',
            priority: 90,
            enforce: true,
            reuseExistingChunk: true,
          },
          // Animation libraries - split into separate chunks
          framerMotion: {
            test: /[\\/]node_modules[\\/](framer-motion)[\\/]/,
            name: 'framer-motion',
            chunks: 'async',
            priority: 80,
            enforce: true,
            reuseExistingChunk: true,
          },
          gsap: {
            test: /[\\/]node_modules[\\/](gsap)[\\/]/,
            name: 'gsap',
            chunks: 'async',
            priority: 80,
            enforce: true,
            reuseExistingChunk: true,
          },
          reactSpring: {
            test: /[\\/]node_modules[\\/](@react-spring)[\\/]/,
            name: 'react-spring',
            chunks: 'async',
            priority: 80,
            enforce: true,
            reuseExistingChunk: true,
          },
          // UI Libraries - lazy loaded
          radixUI: {
            test: /[\\/]node_modules[\\/](@radix-ui)[\\/]/,
            name: 'radix-ui',
            chunks: 'async',
            priority: 70,
            enforce: true,
            reuseExistingChunk: true,
          },
          icons: {
            test: /[\\/]node_modules[\\/](@heroicons|lucide-react)[\\/]/,
            name: 'icons',
            chunks: 'async',
            priority: 65,
            enforce: true,
            reuseExistingChunk: true,
          },
          // Socket.io - only load when needed
          socketio: {
            test: /[\\/]node_modules[\\/](socket\.io-client)[\\/]/,
            name: 'socketio',
            chunks: 'async',
            priority: 60,
            enforce: true,
            reuseExistingChunk: true,
          },
          // Utilities
          utilities: {
            test: /[\\/]node_modules[\\/](axios|date-fns|clsx|tailwind-merge|class-variance-authority)[\\/]/,
            name: 'utilities',
            chunks: 'all',
            priority: 50,
            enforce: true,
            reuseExistingChunk: true,
          },
          // Hooks and smaller libs
          hooks: {
            test: /[\\/]node_modules[\\/](@uidotdev|react-use-measure)[\\/]/,
            name: 'hooks',
            chunks: 'async',
            priority: 40,
            enforce: true,
            reuseExistingChunk: true,
          },
          // All other vendor code
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            enforce: true,
            reuseExistingChunk: true,
          },
          // Common code used across multiple chunks
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      },
      runtimeChunk: 'single',
    };

    // Add compression plugin
    config.plugins.push(
      new CompressionPlugin({
        algorithm: 'gzip',
        test: /\.(js|css|html|svg)$/,
        threshold: 8192,
        minRatio: 0.8,
      })
    );

    // Add Brotli compression
    config.plugins.push(
      new CompressionPlugin({
        filename: '[path][base].br',
        algorithm: 'brotliCompress',
        test: /\.(js|css|html|svg)$/,
        compressionOptions: {
          level: 11,
        },
        threshold: 8192,
        minRatio: 0.8,
      })
    );
  }

  // Add module rules for better asset handling
  config.module.rules.push({
    test: /\.(png|jpe?g|gif|svg)$/i,
    type: 'asset',
    parser: {
      dataUrlCondition: {
        maxSize: 8 * 1024, // 8kb
      },
    },
    generator: {
      filename: 'static/media/[name].[hash:8][ext]',
    },
  });

  // Add performance hints
  config.performance = {
    maxAssetSize: 512000, // 500kb
    maxEntrypointSize: 512000, // 500kb
    hints: 'warning',
  };

  return config;
};