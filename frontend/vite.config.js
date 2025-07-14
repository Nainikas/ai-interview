import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: [
        '@mediapipe/camera_utils',
        '@mediapipe/face_mesh',
        '@mediapipe/drawing_utils'
      ],
    },
  },
});
