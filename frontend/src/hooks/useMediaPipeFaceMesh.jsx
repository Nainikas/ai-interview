// src/hooks/useMediaPipeFaceMesh.jsx
import { useEffect, useRef } from "react";
import * as faceMesh from "@mediapipe/face_mesh";
import * as drawingUtils from "@mediapipe/drawing_utils";

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

    faceMeshInstance.onResults((results) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx) return;

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (results.multiFaceLandmarks.length > 0) {
        drawingUtils.drawConnectors(ctx, results.multiFaceLandmarks[0], faceMesh.FACEMESH_TESSELATION,
          { color: "#C0C0C070", lineWidth: 1 });
        onData(results.multiFaceLandmarks[0]);
      }
    });

    async function loadCamera() {
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

    loadCamera();

    return () => {
      if (camera && camera.stop) camera.stop();
    };
  }, [onData]);

  return { videoRef, canvasRef };
}
