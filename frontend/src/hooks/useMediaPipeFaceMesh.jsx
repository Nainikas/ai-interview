// src/hooks/useMediaPipeFaceMesh.jsx
import { useEffect, useRef } from "react";
import * as mp from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

// Optional: basic expression estimation (smile, neutral)
function estimateEmotion(landmarks) {
  if (!landmarks || landmarks.length === 0) return "no-face";

  const leftMouth = landmarks[61];
  const rightMouth = landmarks[291];
  const topMouth = landmarks[13];
  const bottomMouth = landmarks[14];

  const mouthWidth = Math.abs(rightMouth.x - leftMouth.x);
  const mouthHeight = Math.abs(bottomMouth.y - topMouth.y);

  if (mouthHeight / mouthWidth > 0.4) return "surprised";
  if (mouthHeight / mouthWidth > 0.25) return "smiling";
  return "neutral";
}

export default function useMediaPipeFaceMesh(handleBehavior) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const faceMesh = new mp.FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults(async (results) => {
      const landmarks = results.multiFaceLandmarks?.[0] || [];
      const emotion = estimateEmotion(landmarks);
      if (handleBehavior) {
        await handleBehavior(landmarks, emotion);
      }

      // Optional: draw for debugging
      const canvasCtx = canvasRef.current?.getContext("2d");
      if (canvasCtx && results.image) {
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);
        canvasCtx.restore();
      }
    });

    if (
      typeof window !== "undefined" &&
      videoRef.current &&
      canvasRef.current
    ) {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await faceMesh.send({ image: videoRef.current });
        },
        width: 640,
        height: 480,
      });
      camera.start();
    }
  }, [handleBehavior]);

  return { videoRef, canvasRef };
}
