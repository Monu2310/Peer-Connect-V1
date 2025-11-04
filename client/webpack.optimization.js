// Webpack optimization configuration
module.exports = {
  // Code splitting configuration
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Vendor dependencies
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true
        },
        // React and related
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
          name: 'react-vendors',
          priority: 20,
          reuseExistingChunk: true
        },
        // UI libraries
        ui: {
          test: /[\\/]node_modules[\\/](framer-motion|lucide-react|recharts)[\\/]/,
          name: 'ui-vendors',
          priority: 15,
          reuseExistingChunk: true
        },
        // Common chunks used in multiple places
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true
        }
      }
    },
    runtimeChunk: {
      name: 'runtime'
    },
    minimize: true,
    sideEffects: false
  },
  
  // Module federation for micro-frontends (optional)
  output: {
    // Enable long-term caching
    filename: '[name].[contenthash:8].js',
    chunkFilename: '[name].[contenthash:8].chunk.js',
    // Clean output directory
    clean: true
  },

  // Cache configuration for faster builds
  cache: {
    type: 'filesystem',
    cacheDirectory: '.webpack_cache'
  },

  // Module rules optimization
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true
          }
        }
      }
    ]
  }
};
