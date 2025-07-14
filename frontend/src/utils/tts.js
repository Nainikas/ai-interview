// frontend/src/utils/tts.js

const AudioContextClass = window.AudioContext || window.webkitAudioContext;
export const audioCtx = new AudioContextClass();

export async function speakText(text) {
  console.log("[TTS] speakText →", text);

  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }

  // POST to our FastAPI /speak endpoint
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      voice: "alloy"    // specify the Alloy voice
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[TTS] fetch error:", err);
    throw new Error(err);
  }

  const buffer      = await res.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(buffer);

  return new Promise((resolve) => {
    const src = audioCtx.createBufferSource();
    src.buffer  = audioBuffer;
    src.connect(audioCtx.destination);
    src.onended = resolve;
    src.start();
  });
}
