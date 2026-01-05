import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],

  source: {
    entry: {
      index: './src/index.tsx'
    },
    define: {
      'process.env.API_BASE_URL': JSON.stringify(
        // In development, use empty string to leverage Rsbuild proxy
        // In production, use the actual backend URL
        process.env.NODE_ENV === 'development' ? '' : (process.env.API_BASE_URL || 'http://localhost:3001')
      )
    }
  },

  output: {
    target: 'web',
    distPath: {
      root: 'dist'
    },
    cssModules: {
      localIdentName: '[local]_[hash:base64:5]'
    }
  },

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },

  html: {
    template: './index.html'
  },

  tools: {
    rspack: {
      configuration: {
        resolve: {
          alias: {
            '@': './src'
          }
        }
      }
    }
  },

  performance: {
    chunkSplit: {
      strategy: 'split-by-experience',
      override: {
        'vendor-antd': {
          test: /[\\/]node_modules[\\/](antd|@ant-design)[\\/]/,
          priority: 20,
        },
        'vendor-framer-motion': {
          test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
          priority: 15,
        },
        'vendor-react': {
          test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
          priority: 10,
        },
      },
    },
  }
});
