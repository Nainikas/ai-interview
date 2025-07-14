import { useRef, useEffect } from "react";
import * as faceapi from "face-api.js";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

export default function useMediaPipeFaceMesh(onResults) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let camera = null;
    let stopped = false;

    // ─── Load face-api.js models ────────────────────────────────────────────────
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceExpressionNet.loadFromUri("/models");
    };

    // ─── Continuous detection loop via requestAnimationFrame ───────────────────
    const detectLoop = async () => {
      if (stopped) return;
      const video = videoRef.current;
      if (
        video &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
      ) {
        try {
          const det = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();

          let landmarks = [];
          let expression = "neutral";

          if (det && det.detection.score > 0.5) {
            landmarks = det.landmarks.positions;  // array of { x, y }
            expression = Object.entries(det.expressions).reduce(
              (a, b) => (a[1] > b[1] ? a : b)
            )[0];
          }

          onResults(landmarks, expression);
        } catch (e) {
          console.warn("Face-api detection error:", e);
        }
      }
      requestAnimationFrame(detectLoop);
    };

    loadModels()
      .then(() => {
        requestAnimationFrame(detectLoop);
      })
      .catch(console.error);

    // ─── MediaPipe FaceMesh setup for drawing ──────────────────────────────────
    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });
    faceMesh.setOptions({
      maxNumFaces:            1,
      refineLandmarks:        true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence:  0.5,
    });
    faceMesh.onResults((results) => {
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const ctx = canvas.getContext("2d");
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.save();
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.drawImage(results.image, 0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    });

    const startCamera = async () => {
      const video = videoRef.current;
      if (!video) return;

      camera = new Camera(video, {
        onFrame: async () => {
          if (stopped) return;
          if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            try {
              await faceMesh.send({ image: video });
            } catch (err) {
              if (!stopped) console.warn("FaceMesh send error (ignored):", err);
            }
          }
        },
        width:  640,
        height: 480,
      });
      camera.start();
    };

    startCamera();

    return () => {
      stopped = true;
      camera?.stop();
      faceMesh.close();
    };
  }, [onResults]);

  return { videoRef, canvasRef };
}