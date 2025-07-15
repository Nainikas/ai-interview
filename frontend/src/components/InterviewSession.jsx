import React, { useEffect, useRef, useState } from "react";
import api from "../api";
import { speakText, audioCtx } from "../utils/tts";
import useMediaPipeFaceMesh from "../hooks/useMediaPipeFaceMesh";

const SILENCE_STAGE_1 = 10000;
const SILENCE_STAGE_2 = 6000;

const SILENCE_PROMPT =
  "It seems you’ve been quiet. Would you like me to repeat the last question?";
const AUTO_SKIP_PROMPT =
  "Since I didn't hear anything, let's move on to the next question.";

export default function InterviewSession() {
  const recRef = useRef(null);
  const initedRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isPausedRef = useRef(false);
  const fetchingNextRef = useRef(false);
  const historyRef = useRef([]);
  const lastQuestionRef = useRef("");
  const lastFinalRef = useRef("");
  const lastSpokenTextRef = useRef("");
  const hasHeardRef = useRef(false);
  const responseBufferRef = useRef("");
  const capturingRef = useRef(false);
  const speechEndTimerRef = useRef(null);
  const sessionTimer = useRef(null);
  const silenceTimers = useRef({ prompt: null, skip: null });
  const candidateIdRef = useRef(null);

  const [started, setStarted] = useState(false);

  function clearSilenceTimers() {
    clearTimeout(silenceTimers.current.prompt);
    clearTimeout(silenceTimers.current.skip);
    silenceTimers.current.prompt = silenceTimers.current.skip = null;
  }

  function scheduleSilence() {
    clearSilenceTimers();
    silenceTimers.current.prompt = setTimeout(async () => {
      if (hasHeardRef.current) return;
      await controlSpeakAndListen(SILENCE_PROMPT, false);
      silenceTimers.current.skip = setTimeout(async () => {
        if (hasHeardRef.current) return;
        await controlSpeakAndListen(AUTO_SKIP_PROMPT, false);
        await handleUserTurn("[SKIP]");
      }, SILENCE_STAGE_2);
    }, SILENCE_STAGE_1);
  }

  // 🚨 New helper: flush buffered user speech before AI speaks
  async function flushAnswer() {
    const buf = responseBufferRef.current.trim();
    if (!buf) return;
    responseBufferRef.current = "";
    await handleUserTurn(buf);
  }

  async function controlSpeakAndListen(text, scheduleAfter = true) {
    // ensure any pending user speech is sent
    await flushAnswer();

    try { recRef.current.abort(); } catch {}
    isSpeakingRef.current = true;
    isPausedRef.current = true;
    clearSilenceTimers();

    await new Promise(r => setTimeout(r, 400));
    await audioCtx.suspend();
    lastSpokenTextRef.current = text;
    await speakText(text);
    await audioCtx.resume();
    await new Promise(r => setTimeout(r, 500));

    isSpeakingRef.current = false;
    if (isPausedRef.current) {
      try { recRef.current.start(); } catch {}
    }

    // start buffering user speech now
    capturingRef.current = true;
    hasHeardRef.current = false;

    if (scheduleAfter) {
      scheduleSilence();
    }
  }

  function stopSession() {
    clearSilenceTimers();
    clearTimeout(sessionTimer.current);
    isPausedRef.current = false;
    isSpeakingRef.current = false;
    setStarted(false);
    historyRef.current = [];
    lastQuestionRef.current = "";
  }

  async function handleUserTurn(content) {
    historyRef.current.push({ role: "user", content });
    responseBufferRef.current = "";  // clear the buffer for the next answer
    await fetchNext(content);
  }

  async function fetchNext(user_input = "") {
    if (fetchingNextRef.current) return;
    fetchingNextRef.current = true;

    clearSilenceTimers();
    const raw = historyRef.current.slice(-10);
    const clean = raw.map(({ role, content }) => ({ role, content }));

    try {
      const resp = await api.post("/interview/ask", {
        history: clean,
        candidate_id: candidateIdRef.current,
        session_id: candidateIdRef.current,
        user_input: user_input || "[INIT]",
      });
      const answer = resp.answer;
      if (!answer) throw new Error("Missing 'answer' in /interview/ask response");

      historyRef.current.push({ role: "assistant", content: answer });
      lastQuestionRef.current = extractQuestion(answer);
      await controlSpeakAndListen(answer, true);
    } catch (e) {
      console.warn("fetchNext failed:", e);
      await controlSpeakAndListen(
        "Sorry, I had trouble fetching the next question—let's try again shortly.",
        false
      );
    } finally {
      fetchingNextRef.current = false;
    }
  }

  function extractQuestion(text) {
    const qIdx = text.lastIndexOf("?");
    if (qIdx < 0) return text;
    const prev = text.lastIndexOf(".", qIdx);
    return text.slice(prev + 1, qIdx + 1).trim();
  }

  async function onFinalize() {
    if (isSpeakingRef.current) return;
    capturingRef.current = false;
    clearTimeout(speechEndTimerRef.current);
    const utter = lastFinalRef.current.trim();
    clearSilenceTimers();

    const lastTTS = lastSpokenTextRef.current.trim().toLowerCase();
    if (utter.toLowerCase() === lastTTS) {
      console.log("[ASR] Detected echo of last AI prompt. Ignoring.");
      return;
    }

    if (!utter) return handleUserTurn("[EMPTY]");
    if (/\b(move on|skip|next question|continue)\b/i.test(utter)) {
      return handleUserTurn("[SKIP]");
    }
    return handleUserTurn(utter);
  }

  // ✅ Semantic completeness check
  function isComplete(utter) {
    const wordCount = utter.trim().split(/\s+/).length;
    const endsWithPunctuation = /[a-zA-Z0-9][\.\?!'"”)]?$/.test(utter.trim());
    return wordCount > 6 && endsWithPunctuation;
  }

  useEffect(() => {
    if (initedRef.current) return;
    initedRef.current = true;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return console.error("SpeechRecognition not supported");

    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;

    // 🎯 Debounced onspeechend: only if we’re capturing, 1s delay
    rec.onspeechend = () => {
      if (!capturingRef.current) return;
      clearTimeout(rec.finalizeTimer);
      clearTimeout(speechEndTimerRef.current);
      speechEndTimerRef.current = setTimeout(onFinalize, 1000);
    };

    rec.onresult = (evt) => {
      if (isSpeakingRef.current || !capturingRef.current) return;
      let final = "", interim = "";
      for (let i = evt.resultIndex; i < evt.results.length; i++) {
        const r = evt.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      if (!final && !interim) return;

      const chunk = (final || interim).trim();
      responseBufferRef.current += chunk + " ";
      lastFinalRef.current = responseBufferRef.current.trim();
      hasHeardRef.current = true;

      if (final) {
        console.log("[ASR] Final:", final);
        clearTimeout(rec.finalizeTimer);
        const delay = isComplete(final) ? 1200 : 3000;
        rec.finalizeTimer = setTimeout(onFinalize, delay);
      } else {
        console.log("[ASR] Interim:", interim);
      }
    };

    rec.onerror = (e) => {
      if (e.error !== "aborted" && e.error !== "no-speech") {
        console.warn(e);
      }
    };

    rec.onend = () => {
      if (!isSpeakingRef.current && !isPausedRef.current) {
        try { rec.start(); } catch {}
      }
    };

    recRef.current = rec;
    window.addEventListener("beforeunload", stopSession);
    return () => {
      try { rec.abort(); } catch {}
      window.removeEventListener("beforeunload", stopSession);
      clearSilenceTimers();
      clearTimeout(sessionTimer.current);
      clearTimeout(speechEndTimerRef.current);
    };
  }, []);

  const startInterview = async () => {
    if (started) return;
    setStarted(true);

    try {
      const res = await api.post("/interview/start-session");
      candidateIdRef.current = res.session_id;
    } catch (e) {
      console.error("Failed to start session:", e);
      candidateIdRef.current = `fallback-${Date.now()}`;
    }

    if (audioCtx.state === "suspended") await audioCtx.resume();
    try { recRef.current.start(); } catch {}

    sessionTimer.current = setTimeout(() => {
      stopSession();
      controlSpeakAndListen("Your 30-minute session has ended. Thank you!", false);
    }, 30 * 60 * 1000);

    await fetchNext();
  };

  const handleBehavior = async (
    landmarks,
    rawEmotion = "neutral",
    rawGaze = "center"
  ) => {
    if (!candidateIdRef.current) return;

    const emotionMap = { smiling: "happy" };
    const emotion = emotionMap[rawEmotion] ?? rawEmotion ?? "neutral";
    const face_present = Array.isArray(landmarks) && landmarks.length > 0;
    const gaze_direction = rawGaze ?? "center";

    await api.post("/interview/log-behavior", {
      session_id: candidateIdRef.current,
      emotion,
      face_present,
      gaze_direction,
    }).catch((err) => {
      console.warn("⚠️ Behavior log failed:", err);
    });
  };

  const { videoRef, canvasRef } = useMediaPipeFaceMesh(handleBehavior);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        textAlign: "center",
        zIndex: 1
      }}>
        <h1>AI Interview Agent</h1>
        <button onClick={startInterview} disabled={started}>
          {started ? "Interview in progress…" : "Start Interview"}
        </button>
        <p>{started ? "🎤 Mic active — speak freely" : "🗣️ Click to begin"}</p>
      </div>

      {started && (
        <div style={{
          position: "absolute",
          top: "calc(50% + 80px)",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 0
        }}>
          <div className="dot dot-1" />
          <div className="dot dot-2" />
          <div className="dot dot-3" />
        </div>
      )}

      <video
        ref={videoRef}
        style={{
          position: "fixed",
          bottom: 10,
          right: 10,
          width: 160,
          height: 120,
          border: "2px solid #444",
          borderRadius: 4,
          zIndex: 1
        }}
        autoPlay
        muted
        playsInline
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
