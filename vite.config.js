import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build',
    emptyOutDir: true,
    // Production source maps for error tracking (hidden from browser devtools)
    sourcemap: 'hidden',
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Inline assets smaller than 8KB
    assetsInlineLimit: 8192,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-ui': ['lucide-react'],
        }
      }
    },
    chunkSizeWarningLimit: 600,
    // Minification
    minify: 'esbuild',
    // CSS optimization
    cssMinify: true,
  },
  // Optimize dev server
  server: {
    open: true,
    host: true,
    // `npm run dev:api` runs the Worker (API + D1) on :8787
    proxy: {
      '/api': 'http://127.0.0.1:8787',
      '/files': 'http://127.0.0.1:8787',
    },
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})
