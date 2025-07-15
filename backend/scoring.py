# backend/scoring.py

from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.chains import LLMChain
from typing import Dict
from collections import Counter
import logging
import json

from db import database, behavior_logs  

# ─── Score Weights ────────────────────────────────────────────────
SCORE_WEIGHTS = {
    "relevance": 2,
    "accuracy": 3,
    "completeness": 2,
    "clarity": 1,
}

llm = ChatOpenAI(model="gpt-4o", temperature=0.3)
logger = logging.getLogger(__name__)

# ─── Rubric Prompt (MODIFIED to include resume context) ─────────
rubric_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a strict but fair AI interviewer. Use the resume as context, but do NOT assume an answer is false just because it's not mentioned there. Only flag hallucinations if the answer contains clearly fabricated or implausible information."),
    ("user", """
Resume:
{resume}

Question:
{question}

Answer:
{answer}

Respond ONLY in this JSON format:
{
  "relevance": float (0-1),
  "accuracy": float (0-1),
  "completeness": float (0-1),
  "clarity": float (0-1),
  "hallucination": "Valid" | "Speculative" | "Hallucination"
}

Hallucination Guidelines:
- "Valid": Answer is plausible and either supported or not contradicted by resume.
- "Speculative": Reasonable extrapolation from the resume or generic domain knowledge.
- "Hallucination": Clearly invented or factually incorrect detail.
""")
])
scoring_chain = LLMChain(llm=llm, prompt=rubric_prompt)

# ─── Main Scoring Function ( Accepts resume input) ───────────────
async def score_answer(question: str, answer: str, resume: str = "") -> Dict:
    try:
        result = await scoring_chain.arun({
            "question": question,
            "answer": answer,
            "resume": resume or "No resume provided."
        })
        parsed = json.loads(result)
        subscores = {
            "relevance":    float(parsed["relevance"]),
            "accuracy":     float(parsed["accuracy"]),
            "completeness": float(parsed["completeness"]),
            "clarity":      float(parsed["clarity"]),
        }
        hallucination = parsed["hallucination"]
        total_score = adaptive_score(subscores)
        return {
            "score": total_score,
            "subscores": subscores,
            "hallucination": hallucination
        }
    except Exception as e:
        logger.exception("Scoring failed:", e)
        return {
            "score": 0.5,
            "subscores": {},
            "hallucination": "Unknown"
        }

# ─── Weighted Total Score ─────────────────────────────────────────
def adaptive_score(subscores: Dict[str, float], weights=SCORE_WEIGHTS) -> float:
    total = sum(subscores[k] * weights.get(k, 1) for k in subscores)
    return round(total / sum(weights.values()), 3)

# ─── Compute Tone from Emotion Logs ──────────────────────────────
async def compute_tone(session_id: str) -> str:
    rows = await database.fetch_all(
        behavior_logs.select().where(behavior_logs.c.candidate_id == session_id)
    )

    emotions = [row["emotion"] for row in rows if row["emotion"]]
    if not emotions:
        return "neutral"

    counter = Counter(emotions)
    most_common, _ = counter.most_common(1)[0]

    emotion_to_tone = {
        "happy": "confident",
        "surprised": "curious",
        "angry": "frustrated",
        "sad": "anxious",
        "neutral": "neutral",
        "fearful": "nervous",
        "disgusted": "disengaged"
    }
    return emotion_to_tone.get(most_common, "neutral")
