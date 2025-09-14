const { DefinePlugin } = require('webpack');
const CompressionPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = function override(config, env) {
  // Only apply optimizations in production
  if (env === 'production') {
    // Enable tree shaking
    config.optimization = {
      ...config.optimization,
      sideEffects: false,
      usedExports: true,
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ['console.log'],
            },
            mangle: true,
          },
          extractComments: false,
        }),
      ],
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: 20,
        maxAsyncRequests: 20,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            enforce: true,
          },
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 20,
            enforce: true,
          },
          animations: {
            test: /[\\/]node_modules[\\/](framer-motion|@react-spring|gsap)[\\/]/,
            name: 'animations',
            chunks: 'all',
            priority: 25,
            enforce: true,
          },
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|@heroicons|lucide-react)[\\/]/,
            name: 'ui-library',
            chunks: 'all',
            priority: 22,
            enforce: true,
          },
          utilities: {
            test: /[\\/]node_modules[\\/](axios|date-fns|clsx|tailwind-merge)[\\/]/,
            name: 'utilities',
            chunks: 'all',
            priority: 15,
            enforce: true,
          },
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