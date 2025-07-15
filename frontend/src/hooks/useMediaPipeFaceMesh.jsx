// src/hooks/useMediaPipeFaceMesh.jsx
import { useEffect, useRef } from "react";
import * as faceMesh from "@mediapipe/face_mesh";
import * as drawingUtils from "@mediapipe/drawing_utils";
import * as faceapi from "face-api.js";

export default function useMediaPipeFaceMesh(onData) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let camera = null;

    const faceMeshInstance = new faceMesh.FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMeshInstance.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMeshInstance.onResults(async (results) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx) return;

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];

        // Draw facial mesh
        drawingUtils.drawConnectors(
          ctx,
          landmarks,
          faceMesh.FACEMESH_TESSELATION,
          { color: "#C0C0C070", lineWidth: 1 }
        );

        // 🔹 Emotion detection using face-api.js
        const detections = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions();

        let dominantExpression = "neutral";
        if (detections && detections.expressions) {
          const sorted = Object.entries(detections.expressions).sort(
            (a, b) => b[1] - a[1]
          );
          dominantExpression = sorted[0][0];
        }

        // 🔹 Gaze direction estimation
        let rawGaze = "center";
        try {
          const leftEye = landmarks[33];   // outer corner of left eye
          const rightEye = landmarks[263]; // outer corner of right eye
          const iris = landmarks[468];     // center of right iris (refined landmarks must be on)

          const eyeWidth = rightEye.x - leftEye.x;
          const irisOffset = iris.x - leftEye.x;
          const relX = irisOffset / eyeWidth;

          if (relX < 0.35) rawGaze = "left";
          else if (relX > 0.65) rawGaze = "right";

          const eyeY = (leftEye.y + rightEye.y) / 2;
          const relY = iris.y - eyeY;

          if (relY > 0.03) rawGaze = "down";
          else if (Math.abs(relY) > 0.06) rawGaze = "away";
        } catch (err) {
          console.warn("Gaze detection error:", err);
        }

        // ✅ Send all 3 signals: landmarks, emotion, gaze
        onData(landmarks, dominantExpression, rawGaze);
      }
    });

    async function loadModelsAndCamera() {
      // Load face-api models from public/models
      await Promise.all([
        faceapi.nets.tinyFaceDetector.load("/models"),
        faceapi.nets.faceExpressionNet.load("/models"),
      ]);

      const { Camera } = await import("@mediapipe/camera_utils");
      camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await faceMeshInstance.send({ image: videoRef.current });
        },
        width: 640,
        height: 480,
      });
      camera.start();
    }

    loadModelsAndCamera();

    return () => {
      if (camera && camera.stop) camera.stop();
    };
  }, [onData]);

  return { videoRef, canvasRef };
}
