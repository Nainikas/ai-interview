# backend/routes/interview.py

import os
from uuid import uuid4
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Dict
from datetime import datetime

from openai import OpenAI
from db import database, interview_logs
from scoring import adaptive_score, compute_subscores, check_hallucination

# RAG helpers
from rag import ingest_resume, get_retriever

# Tone (keep compute_tone for now)
from agent import compute_tone

router = APIRouter()
client = OpenAI()

SYSTEM_PROMPT = r"""
You are a professional, supportive AI interview agent. On each turn you will receive exactly one of:
  • The candidate’s spoken text
  • The token [EMPTY] if they said nothing for 10 s
  • The token [SKIP] if they explicitly asked to skip

Follow this state-machine exactly:
1. **First two turns** (fixed):
   • Q1: Which role are you applying for?
   • Q2: Please give me a brief introduction of your experience.
2. **All subsequent turns**: use RAG+LLM to generate the next question.
"""

SCORE_WEIGHTS = {
    "relevance":    2,
    "accuracy":     3,
    "completeness": 2,
    "clarity":      1,
}

class AskRequest(BaseModel):
    history:      List[Dict[str, str]]
    candidate_id: str
    session_id:   str
    user_input:   str

class FeedbackRequest(BaseModel):
    session_id: str
    answer:     str

@router.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    # validation & save as before...
    ext = file.filename.split(".")[-1]
    temp_path = f"./temp_resume_{uuid4()}.{ext}"
    contents = await file.read()
    with open(temp_path, "wb") as f:
        f.write(contents)
    try:
        chunks_indexed = await ingest_resume(temp_path, file.content_type)
    except Exception as e:
        raise HTTPException(500, f"Ingestion failed: {e}")
    return {"status": "ok", "chunks_indexed": chunks_indexed}

@router.post("/ask")
async def ask(req: AskRequest):
    try:
        # Starter questions...
        real_answers = [m for m in req.history if m["role"]=="user" and m["content"] not in ("[EMPTY]","[SKIP]")]
        if len(real_answers)==0:
            return {"answer":"Hello! Which role are you applying for today?","score":None,"subscores":None,"hallucination":None}
        if len(real_answers)==1:
            return {"answer":"Please give me a brief introduction of your previous work experience, education, and key skills.","score":None,"subscores":None,"hallucination":None}

        # Silence/skip/repeat/etc. (unchanged)...

        # Normal RAG + LLM flow
        messages = [{"role":"system","content":SYSTEM_PROMPT}]
        for m in req.history:
            messages.append({"role":m["role"],"content":m["content"]})
        messages.append({"role":"user","content":req.user_input})

        # inject resume context
        retriever = get_retriever()
        docs = retriever.get_relevant_documents(req.user_input)
        context = "\n\n".join(d.page_content for d in docs)
        messages.insert(1, {"role":"system","content":f"Use the resume info:\n\n{context}"})

        # inject tone
        tone = await compute_tone(req.session_id)
        messages.insert(2, {"role":"system","content":f"The candidate seems {tone}. Ask next question."})

        # === REPLACED AGENT CALL ===
        resp = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.7,
        )
        question = resp.choices[0].message.content

        # scoring & logging...
        score = subscores = hallucination = None
        if len(req.user_input.split())>=2 and req.user_input not in ("[EMPTY]","[SKIP]"):
            prev_q = messages[-2]["content"]
            subscores     = compute_subscores(prev_q, req.user_input)
            score         = adaptive_score(subscores, SCORE_WEIGHTS)
            hallucination = check_hallucination(prev_q, req.user_input)
            await database.execute(
                interview_logs.insert().values(
                    candidate_id= req.candidate_id,
                    question=     prev_q,
                    answer=       req.user_input,
                    score=        score,
                    subscores=    subscores,
                    hallucination= hallucination,
                    timestamp=    datetime.utcnow()
                )
            )

        return {"answer":question,"score":score,"subscores":subscores,"hallucination":hallucination}

    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(500, f"/ask failed: {e}")

@router.post("/feedback")
async def feedback(request: FeedbackRequest):
    try:
        # Use an empty string for prev_q so compute_subscores/check_hallucination won't break
        prev_q = ""

        # 1) Compute subscores
        subscores = compute_subscores(prev_q, request.answer)

        # 2) Compute overall score
        score = adaptive_score(subscores, SCORE_WEIGHTS)

        # 3) Check hallucination
        hallucination = check_hallucination(prev_q, request.answer)

        # 4) Persist to DB
        await database.execute(
            interview_logs.insert().values(
                candidate_id=  request.session_id,
                question=      None,
                answer=        request.answer,
                score=         score,
                subscores=     subscores,
                hallucination= hallucination,
                timestamp=     datetime.utcnow(),
            )
        )

        # 5) Return
        return {
            "score":         score,
            "subscores":     subscores,
            "hallucination": hallucination,
        }

    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(500, f"/feedback failed: {e}")
