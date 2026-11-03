import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The app calls the relative path /api, so Vite forwards it to the Express backend
  server: { proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } } },
})