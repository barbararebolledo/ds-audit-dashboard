import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@audit': path.resolve(__dirname, '../ds-ai-audit'),
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
})
