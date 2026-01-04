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
      strategy: 'all-in-one'
    }
  }
});
