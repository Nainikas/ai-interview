# 🤖 AI Interview Agent – Personalized Interview System

## 🚀 Challenge Overview

This project demonstrates a personalized AI Interview Agent that simulates intelligent, adaptive interviews tailored to each candidate’s background, behavior, and job role. The system is designed to evaluate candidates more holistically while streamlining the interview process for hiring teams.

---

## 🎯 Business Goal

Develop a next-generation interview platform that:

* Conducts voice-based, real-time interviews.
* Adapts to candidate inputs dynamically.
* Provides standardized scoring and evaluation.
* Surfaces behavioral and contextual insights.
* Supports role-specific and adaptive questioning.

This AI agent enhances hiring efficiency, fairness, and decision-making by combining voice AI, behavioral analytics, and intelligent scoring.

---

## 🏗️ System Design: Personalized Interview Architecture

### ✅ Inputs

* **Voice Input** (via microphone)
* **Resume Upload** (PDF)
* **Declared Role** (e.g., "Machine Learning Engineer")
* **Behavioral Signals** (facial presence, gaze, silence)
* **Turn-by-Turn Q\&A History**

### 🤖 AI Functionalities

* **LLM Agent (OpenAI GPT-4o)**

  * Generates adaptive and role-specific questions
  * Responds to silence, clarification, or teaching prompts
* **LangChain Orchestration**

  * Manages context and memory
  * Integrates vector search from parsed resume (ChromaDB)
* **Voice Interaction**

  * Transcribes responses with Whisper
  * Delivers questions using OpenAI TTS
* **Behavioral Analytics**

  * Face & eye tracking via MediaPipe
  * Suspicion triggers for disengagement
* **Scoring & Evaluation**

  * Custom rubric: Relevance, Clarity, Specificity
  * Hallucination detection via GPT-based checks
* **Real-Time Coaching**

  * Automatically offers hints during underperformance

### 🧾 Outputs

* Dynamic AI-driven voice conversation
* Structured answer logs with scores and hallucination results
* Admin dashboard:

  * Session timeline, question-answer pairs
  * Subscores and hallucination flags
  * Behavioral incidents (e.g., no face detected)
* Export options in JSON/CSV

---

## 🛠️ Implementation Details

### 🔗 Tech Stack

| Layer     | Technology                         |
| --------- | ---------------------------------- |
| Frontend  | React + Vite + Tailwind (Vercel)   |
| Backend   | FastAPI + LangChain (Render)       |
| LLM       | OpenAI (GPT-4o, Whisper, TTS)      |
| Vector DB | ChromaDB                           |
| Behavior  | MediaPipe FaceMesh                 |
| Storage   | PostgreSQL via `databases` library |

### 🧠 Interview Flow

1. **Initial Interaction**

   * Candidate is greeted and asked role, experience, and key skills
2. **Context Building**

   * Resume (if available) is parsed and embedded
   * Candidate tone and behavioral inputs logged
3. **Dynamic Q\&A Loop**

   * Adaptive LLM prompt generation
   * Behavioral routing (skip, clarify, teach)
4. **Scoring and Logging**

   * Subscores computed per response
   * Coaching triggered when needed
   * Logs stored and visualized for review

---

## 🔥 Key Features

### 🎯 Role-Specific Questions

* Role tag is embedded in the system prompt
* Resume chunks retrieved via Chroma retriever

### 🎭 Adaptive Tone

* AI tone changes based on gaze, face detection, and engagement history

### 💬 Coaching in Real Time

* When scores drop, AI gently suggests how to improve

### 🧠 Hallucination Detection

* GPT-based factuality self-checks

### 📢 Voice Interaction

* AI speaks using expressive TTS (Alloy voice)
* Candidate responds via microphone; Whisper handles transcription

---

## 🧪 Testing Strategy

* Covered endpoints: `/ask`, `/feedback`, `/upload-resume`, `/log-behavior`
* Tested:
  <img width="1796" height="1004" alt="image" src="https://github.com/user-attachments/assets/656e924d-cfb6-426f-9054-ff152ca7b281" />
  <img width="1848" height="995" alt="image" src="https://github.com/user-attachments/assets/54328e28-3c7f-445d-819d-ca29492bb377" />



Bonus:

* Simulated silence behavior
* LLM classification routes (clarify vs teach)

---

## 💡 Innovation Highlights

* Real-time facial behavior tracking
* Clarify / Teach / Silence route switching based on LLM classification
* Role-adaptive tone modulation
* Resilient voice loop with mic and TTS synchronization
* Interpretable scoring with sub-dimensions

---

## 📁 Folder Structure

```
/ai-agent
├── backend
│   ├── main.py
│   ├── routes/
│   ├── scoring.py
│   ├── db.py
│   └── hallucinations.py
├── frontend
│   ├── src/
│   ├── components/InterviewSession.jsx
│   ├── utils/tts.js
│   └── hooks/useMediaPipeFaceMesh.jsx
└── README.md
```

---

## 🧰 Setup Instructions

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

---

## 🌐 Live Links

* Frontend: [https://ai-interview-agent.vercel.app](https://ai-interview-agent.vercel.app)
* Backend: [https://ai-interview-agent.onrender.com](https://ai-interview-agent.onrender.com)
* Admin View: Visit `/admin` to review interviews, scores, and behavior

---

