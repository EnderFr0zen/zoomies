import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  optimizeDeps: {
    include: ['pouchdb', 'pouchdb-find']
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      events: 'events'
    }
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/]
    }
  },
  server: {
    host: '0.0.0.0', // Allow external connections
    port: 7777,
    strictPort: true,
    proxy: {
      '/api/couchdb': {
        target: 'http://localhost:5984',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/couchdb/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  }
})
