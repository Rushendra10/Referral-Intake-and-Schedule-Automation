import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // /api/* → http://localhost:8000/api/*
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // /files/* → http://localhost:8000/files/* (PDF static serving)
      '/files': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // /health → http://localhost:8000/health (backend health check)
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})