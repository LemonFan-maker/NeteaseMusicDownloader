import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/song': { target: 'http://localhost:5000', changeOrigin: true },
      '/search': { target: 'http://localhost:5000', changeOrigin: true },
      '/playlist': { target: 'http://localhost:5000', changeOrigin: true },
      '/album': { target: 'http://localhost:5000', changeOrigin: true },
      '/download': { target: 'http://localhost:5000', changeOrigin: true },
      '/health': { target: 'http://localhost:5000', changeOrigin: true },
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
})
