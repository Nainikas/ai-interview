// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@mediapipe/face_mesh']
  },
  build: {
    rollupOptions: {
      external: ['@mediapipe/face_mesh'] // This avoids bundling it server-side
    }
  }
})
