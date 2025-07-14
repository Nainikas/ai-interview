export default defineConfig({
  // other config...
  build: {
    rollupOptions: {
      external: [
        "@mediapipe/camera_utils",
        "@mediapipe/face_mesh",
        "@mediapipe/drawing_utils"
      ],
    },
  },
});
