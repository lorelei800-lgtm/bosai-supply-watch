import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/bosai-supply-watch/',
  build: {
    outDir: 'dist',
  },
})
