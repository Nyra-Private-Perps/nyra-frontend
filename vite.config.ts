import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Fixes the "pipeline" and "slice" errors correctly
      'stream': 'stream-browserify',
      'util': 'util',
    },
  },
  define: {
    'global': 'globalThis',
    'process.env': {},
  },
  optimizeDeps: {
    include: ['buffer', 'process', '@safe-global/protocol-kit'],
  },
})