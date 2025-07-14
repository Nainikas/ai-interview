// src/components/InterviewSession.jsx
import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 }        from "uuid";
import api                     from "../api";
import { speakText, audioCtx } from "../utils/tts";
import useMediaPipeFaceMesh    from "../hooks/useMediaPipeFaceMesh";

// Silence timing
const SILENCE_PROMPT_MS = 10000; // 10s
const SILENCE_SKIP_MS   =  6000; //  6s

// Debounce thresholds
const SHORT_WORD_COUNT = 5;
const SHORT_DEBOUNCE   = 800;
const LONG_DEBOUNCE    = 1500;

// Prompts
const SILENCE_PROMPT   = "It seems you’ve been quiet. Would you like me to repeat the last question?";
const AUTO_SKIP_PROMPT = "Since I didn't hear anything, let's move on.";

export default function InterviewSession() {
  // Refs & state
  const recRef           = useRef(null);
  const hasHeardRef      = useRef(false);
  const isSpeakingRef    = useRef(false);
  const isPausedRef      = useRef(false);
  const historyRef       = useRef([]);
  const lastQuestionRef  = useRef("");
  const lastFinalRef     = useRef("");
  const candidateIdRef   = useRef("");
  const sessionTimerRef  = useRef(null);
  const silenceTimersRef = useRef({ prompt: null, skip: null });

  const [started, setStarted] = useState(false);

  // --- Silence scheduling ---
  function clearSilence() {
    clearTimeout(silenceTimersRef.current.prompt);
    clearTimeout(silenceTimersRef.current.skip);
    hasHeardRef.current = false;
  }

  function scheduleSilence() {
    clearSilence();
    silenceTimersRef.current.prompt = setTimeout(async () => {
      if (hasHeardRef.current) return clearSilence();
      await controlSpeakAndListen(SILENCE_PROMPT, false);
      // stage 2
      silenceTimersRef.current.skip = setTimeout(async () => {
        if (hasHeardRef.current) return clearSilence();
        await controlSpeakAndListen(AUTO_SKIP_PROMPT, false);
        await handleUserTurn("[SKIP]");
      }, SILENCE_SKIP_MS);
    }, SILENCE_PROMPT_MS);
  }

  // --- TTS + mic restart wrapper ---
  async function controlSpeakAndListen(text, rearmSilence = true) {
    try { recRef.current.abort(); } catch{}
    isSpeakingRef.current = true;
    isPausedRef.current   = true;
    clearSilence();

    await audioCtx.suspend();
    await speakText(text);
    await audioCtx.resume();

    isSpeakingRef.current = false;
    if (rearmSilence) {
      hasHeardRef.current = false;
      isPausedRef.current = false;
      scheduleSilence();
    }
    try { recRef.current.start(); } catch{}
  }

  // --- ASR finalization handler ---
  async function onFinalize() {
    if (isSpeakingRef.current) return;
    clearSilence();
    const utter = lastFinalRef.current.trim();
    if (!utter)           return handleUserTurn("[EMPTY]");
    if (/\b(move on|skip|next|continue)\b/i.test(utter)) 
                          return handleUserTurn("[SKIP]");
    return handleUserTurn(utter);
  }

  // --- User turn & fetch next question ---
  async function handleUserTurn(content) {
    historyRef.current.push({ role:"user", content });
    // send feedback if real answer
    if (!["[EMPTY]","[SKIP]"].includes(content)) {
      api.post("/feedback", {
        question: lastQuestionRef.current,
        answer:   content
      }).catch(()=>{});
    }
    await fetchNextQuestion();
  }

  async function fetchNextQuestion() {
    clearSilence();
    const recent = historyRef.current.slice(-10);
    try {
      const resp = await api.post("/ask", {
        history:      recent,
        candidate_id: candidateIdRef.current
      });
      const { answer } = resp.data ?? resp;
      if (!answer) throw new Error("No answer");
      historyRef.current.push({ role:"assistant", content: answer });
      lastQuestionRef.current = extractQuestion(answer);
      await controlSpeakAndListen(answer, true);
    } catch(e) {
      console.warn(e);
      await controlSpeakAndListen(
        "Sorry, an error occurred; let's try again shortly.",
        false
      );
    }
  }

  function extractQuestion(text) {
    const q = text.lastIndexOf("?");
    if (q < 0) return text;
    const p = text.lastIndexOf(".", q);
    return text.slice(p+1, q+1).trim();
  }

  // --- Session stop (cleanup + final TTS) ---
  function stopSession() {
    clearSilence();
    clearTimeout(sessionTimerRef.current);
    isPausedRef.current = false;
    isSpeakingRef.current = false;
    setStarted(false);
    historyRef.current = [];
    lastQuestionRef.current = "";
  }

  // --- Setup SpeechRecognition once ---
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return console.error("ASR not supported");
    const rec = new SR();
    rec.lang           = "en-US";
    rec.continuous     = true;
    rec.interimResults = true;

    rec.onresult = e => {
      if (isSpeakingRef.current) return;
      let final = "", interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) final   += r[0].transcript;
        else           interim += r[0].transcript;
      }
      if (!final && !interim) return;
      lastFinalRef.current = (final||interim).trim();
      hasHeardRef.current  = true;

      // debounce
      const wc    = lastFinalRef.current.split(/\s+/).length;
      const delay= final
        ? 0
        : wc <= SHORT_WORD_COUNT
          ? SHORT_DEBOUNCE
          : LONG_DEBOUNCE;

      clearTimeout(rec.finalizeTimer);
      rec.finalizeTimer = setTimeout(onFinalize, delay);
    };

    rec.onerror = ev => {
      if (!["aborted","no-speech"].includes(ev.error)) console.warn(ev);
    };
    rec.onend = () => {
      if (!isSpeakingRef.current && !isPausedRef.current) {
        try { rec.start(); } catch {}
      }
    };

    recRef.current = rec;
    window.addEventListener("beforeunload", stopSession);
    return () => {
      try { rec.abort(); } catch{}
      window.removeEventListener("beforeunload", stopSession);
      clearSilence();
      clearTimeout(sessionTimerRef.current);
    };
  }, []);

  // --- FaceMesh behavior logging callback ---
  const handleBehavior = async (landmarks, emotion) => {
    const face_present = Array.isArray(landmarks) && landmarks.length>0;
    await api.post(
      `/log-behavior?candidate_id=${candidateIdRef.current}` +
      `&emotion=${emotion}&face_present=${face_present}`
    ).catch(()=>{});
  };
  const { videoRef, canvasRef } = useMediaPipeFaceMesh(handleBehavior);

  // --- Kick off the interview ---
  const startInterview = async () => {
    if (started) return;
    setStarted(true);
    candidateIdRef.current = uuidv4();
    if (audioCtx.state === "suspended") await audioCtx.resume();
    try { recRef.current.start(); } catch{}
    // 30-minute hard cutoff
    sessionTimerRef.current = setTimeout(()=>{
      stopSession();
      controlSpeakAndListen("Your 30-minute session has ended. Thank you!", false);
    }, 30*60_000);
    await fetchNextQuestion();
  };

  return (
    <div style={{ position:"relative", width:"100vw", height:"100vh" }}>
      <div style={{
        position:"absolute", top:"50%", left:"50%",
        transform:"translate(-50%,-50%)", textAlign:"center", zIndex:1
      }}>
        <h1>AI Interview Agent</h1>
        <button onClick={startInterview} disabled={started}>
          {started ? "Interview in progress…" : "Start Interview"}
        </button>
        <p>{started ? "🎤 Mic active — speak freely" : "🗣️ Click to begin"}</p>
      </div>

      {started && <div className="dot-loader" />}
      
      <video
        ref={videoRef}
        style={{
          position:"fixed", bottom:10, right:10,
          width:160, height:120, border:"2px solid #444",
          borderRadius:4, zIndex:1
        }}
        autoPlay muted playsInline
      />
      <canvas ref={canvasRef} style={{ display:"none" }} />
    </div>
  );
}
