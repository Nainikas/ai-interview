// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      '@mediapipe/face_mesh',
      '@mediapipe/camera_utils',
      '@mediapipe/drawing_utils'
    ]
  },
  build: {
    commonjsOptions: {
      // ensure any CommonJS mediapipe helpers get picked up
      include: [/node_modules/, /@mediapipe/]
    }
  }
});
