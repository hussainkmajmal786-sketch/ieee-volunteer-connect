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
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
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
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'firebase/app', 'firebase/auth', 'firebase/firestore'],
  },
})
