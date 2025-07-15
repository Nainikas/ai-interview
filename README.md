# 🤖 AI Interview Agent – Personalized Interview System (Proof of Concept)

[![Python](https://img.shields.io/badge/python-3.10-blue)](https://www.python.org) [![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-green)](https://fastapi.tiangolo.com) [![React](https://img.shields.io/badge/React-19.1.0-blue)](https://reactjs.org) [![LangChain](https://img.shields.io/badge/LangChain-0.3.26-yellow)](https://github.com/langchain-ai/langchain) [![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-red)](https://openai.com)

---

## 🚀 Challenge Overview

This project delivers a **proof-of-concept** for a next-generation AI Interview Agent capable of conducting **voice-based**, **personalized**, and **adaptive** interviews. Leveraging LLMs, RAG, behavioral analytics, and real-time scoring, the agent:

* Adapts questions to each candidate’s **role**, **experience**, and **resume**.
* Monitors **facial cues**, **engagement**, and **silence** to adjust tone and prompts.
* Automates **scoring**, **hallucination detection**, and **coaching hints**.

---

## 🎯 Business Goal

Empower hiring teams to:

* **Standardize evaluations** with objective rubrics.
* **Surface hidden insights** via behavioral and factuality checks.
* **Scale interviews** efficiently without losing personalization.
* **Enhance candidate experience** through supportive, real-time feedback.

---

## 🌐 Live Links

* Frontend: [https://ai-interview-c5lqpvcpa-ai-interview.vercel.app)
* Demo: https://drive.google.com/file/d/1kJCqQYsFGJTVVHjcIP3_Sdqj9YuygMop/view?usp=sharing
---

## 🏗️ System Architecture

<img width="3840" height="2111" alt="Untitled diagram _ Mermaid Chart-2025-07-15-165845" src="https://github.com/user-attachments/assets/188e8068-6962-4fa7-b7ab-a115aed57d7b" />

### Inputs

* **Voice Input:** candidate responses via microphone
* **Resume Upload:** optional PDF for context
* **Declared Role:** e.g., "Machine Learning Engineer"
* **Behavioral Signals:** face presence, gaze, silence events
* **Q\&A History:** previous turns stored as context

### AI Functionalities

* **Role-Specific & Adaptive Questioning:** tailored prompts with resume context
* **Silence/Skip Handling:** automatic recovery after no-speech or skip
* **Clarify vs. Teach:** classify follow-up intents
* **RAG-Powered Context:** retrieve relevant resume chunks
* **Automated Scoring:** GPT-based rubric (relevance, clarity, specificity)
* **Hallucination Detection:** self-check factuality
* **Real-Time Coaching:** hints triggered on low engagement or scores

### Outputs

* **Dynamic Voice Conversation:** AI questions and TTS responses
* **Structured Logs:** Q\&A pairs, scores, hallucination flags
* **Behavioral Timelines:** emotion, gaze, presence over time
* **Admin Dashboard:** interactive review & export (JSON/CSV)

---

## 🔥 Key Features

| Feature                         | Description                                                        |
| ------------------------------- | ------------------------------------------------------------------ |
| 🎯 Role-Specific Questions      | System prompt tags role; resume retriever surfaces relevant chunks |
| 💬 Voice-Only Interaction       | Continuous mic listening; expressive TTS (Alloy voice)             |
| 🎭 Adaptive Tone & Prompts      | Adjusts phrasing based on engagement and behavioral cues           |
| 🧠 RAG & Memory Management      | LangChain orchestrates context, memory, and resume embeddings      |
| ✅ Clarify/Teach Classification  | GPT-based intent routing for rephrasing or teaching                |
| 📈 Real-Time Scoring & Coaching | JSON rubric; automated hints when performance dips                 |
| 🚨 Hallucination Detection      | GPT self-checks for factual consistency                            |
| 📊 Behavioral Analytics         | MediaPipe & face-api.js for emotion, gaze, and presence logging    |
| 🖥️ Admin Dashboard             | Reviews sessions, subscores, flags, and behavior incidents         |

---

## 🛠️ Technical Stack

| Layer         | Technology                                                  |
| ------------- | ----------------------------------------------------------- |
| Frontend      | React, Vite, Tailwind, face-api.js, MediaPipe FaceMesh      |
| Backend       | Python 3.10, FastAPI, Uvicorn                               |
| LLM & Agent   | OpenAI GPT-4o, Whisper (ASR removed for AI speech), TTS API |
| Orchestration | LangChain (ChromaDB retriever)                              |
| Database      | PostgreSQL via `databases` library                          |
| Testing       | Pytest, FastAPI TestClient                                  |
| Deployment    | Vercel (Frontend), Render (Backend)                         |

---

## 📂 Project Structure

```
/ai-interview
├── backend
│   ├── main.py             # FastAPI entry point
│   ├── db.py               # Database setup & models
│   ├── rag.py              # Resume ingestion & ChromaDB
│   ├── scoring.py          # GPT scoring & hallucination logic
│   ├── coaching_trigger.py # Real-time coaching logic
│   └── routes/
│       ├── interview.py    # Q&A flow & session logging
│       ├── log_behavior.py # Behavioral endpoints
│       ├── speak.py        # TTS endpoint with caching
│       ├── clarify_check.py# Clarify/teach classifier
│       └── admin.py        # Admin Dashboard API
│
├── frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── InterviewSession.jsx  # Voice UI & logic
│   │   ├── hooks/
│   │   │   └── useMediaPipeFaceMesh.jsx # Behavioral hook
│   │   └── utils/tts.js             # TTS integration
│   ├── package.json
│   └── vite.config.ts               # Vite config & env
│
├── tests/                # Pytest coverage for core logic & endpoints
├── reset_behavior_logs.py# Utility to reset logs table
├── demo/                 # Short demo video & screenshots
├── .gitignore
└── README.md             # This document
```

---

## ⚙️ Setup & Installation

### Prerequisites

* **Python 3.10+**
* **Node.js 18+**
* **OpenAI API key** (with TTS access)
* **PostgreSQL** (or any SQL DB)

### Environment Variables

```bash
# backend/.env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
OPENAI_API_KEY=sk-...
FRONTEND_URL=http://localhost:5173

# frontend/.env
VITE_BACKEND_URL=http://localhost:8000
```

### Run Locally

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

## 🧪 Testing Strategy

* Covered endpoints: `/ask`, `/upload-resume`, `/log-behavior` and more
* Tested:
 `/ask`: <img width="1769" height="979" alt="image" src="https://github.com/user-attachments/assets/df6da2e3-b4eb-4301-b65c-1e04dc9daa63" />

 `/upload-resume` :  <img width="1762" height="917" alt="image" src="https://github.com/user-attachments/assets/04d59c13-e2ae-4da9-903d-7ead95d53567" />

  `/log-behavior`:  <img width="1769" height="921" alt="image" src="https://github.com/user-attachments/assets/01e7ba2f-63a5-4f29-a486-e2d918354fdd" />

---

## 💡 Innovation Highlights

- **Micro‑Expression Intelligence**  
  The agent reads the tiniest facial cues—smiles, frowns, gaze patterns—and weaves them into the conversation flow, turning nonverbal signals into meaningful interview pivots.

- **Intentive Conversation Funnels**  
  A GPT‑powered classifier smart‑routes each turn into one of three paths—**Clarify**, **Teach**, or **Advance**—so the dialogue never stalls and always stays perfectly aligned with candidate needs.

- **Chameleon‑Tone Adaptation**  
  Like a seasoned interviewer, the AI shifts its language style—formal, encouraging, probing—based on real‑time engagement data, creating a bespoke rapport for every candidate.

- **Seamless Audio Handshake**  
  We’ve engineered a robust mic‑to‑TTS choreography (with built‑in pauses and debounces) that ensures crisp, overlap‑free exchanges—no more “you’re cutting out.”

- **Transparent Scoring Deep Dives**  
  Beyond a single grade, the system breaks down each response into granular subscores—**Relevance**, **Clarity**, **Depth**—empowering candidates and reviewers with pinpoint feedback.


---




