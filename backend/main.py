import os
import traceback
from uuid import uuid4
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from db import database, interview_logs, interview_sessions
from rag import ingest_resume, get_retriever
from scoring import score_answer
from tone import compute_tone
from coaching_trigger import get_hint

import requests
from openai import OpenAI
client = OpenAI()

router = APIRouter()

# ─── New: Start Session (for voice-only flow) ──────────────────
@router.post("/start-session")
async def start_session():
    session_id = str(uuid4())
    await database.execute(
        interview_sessions.insert().values(
            id=session_id,
            created_at=datetime.utcnow(),
            candidate_name=None,
            job_role=None,
            resume_file=None
        )
    )
    return {"session_id": session_id}

# ─── Upload Resume ─────────────────────────────────────────────
@router.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    ext = file.filename.split(".")[-1].lower()
    if ext != "pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    candidate_id = str(uuid4())
    temp_path = f"./temp_resume_{candidate_id}.pdf"

    try:
        contents = await file.read()
        with open(temp_path, "wb") as f:
            f.write(contents)

        print(f"📄 Saved uploaded resume: {temp_path}")
        print(f"📄 Ingesting for candidate_id: {candidate_id}")

        chunks = await ingest_resume(temp_path, "application/pdf", candidate_id)

        await database.execute(
            interview_sessions.insert().values(
                id=candidate_id,
                created_at=datetime.utcnow(),
                candidate_name="Candidate",
                job_role=None,
                resume_file=file.filename
            )
        )

        print(f"✅ Resume ingested: {chunks} chunks")
        return {"status": "ok", "chunks_indexed": chunks, "candidate_id": candidate_id}

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Resume ingestion failed: {str(e)}")

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

# ─── Ask Endpoint ──────────────────────────────────────────────
class AskRequest(BaseModel):
    user_input: str
    history: list
    candidate_id: str
    session_id: str

@router.post("/ask")
async def ask(req: AskRequest):
    try:
        real_answers = [m for m in req.history if m["role"] == "user" and m["content"] not in ("[EMPTY]", "[SKIP]")]

        if len(real_answers) == 0:
            return {"answer": "Hello! Which role are you applying for today?", "score": None}
        if len(real_answers) == 1:
            return {"answer": "Please give me a brief introduction of your previous work experience, education, and key skills.", "score": None}

        prev_q = req.history[-1]["content"]

        # ─── Clarify / Teach Check ───────────────────────────────
        try:
            clarify_url = os.getenv("CLARIFY_CHECK_URL", f"{os.getenv('BACKEND_URL', 'http://localhost:8000')}/clarify-check")
            response = requests.post(clarify_url, json={
                "user_input": req.user_input,
                "question": prev_q
            }, timeout=10)
            clarify_type = response.json().get("type", "other")
        except Exception as e:
            print("⚠️ Clarify check failed:", e)
            clarify_type = "other"

        if clarify_type == "teach":
            return {
                "answer": "I'm here to evaluate your understanding, so I can’t explain the answer. Please try your best.",
                "score": None
            }

        if clarify_type == "clarify":
            return {
                "answer": f"Sure! Here's a simpler version of the question:\n\n{prev_q}",
                "score": None
            }

        # ─── Prepare LLM Prompt ─────────────────────────────────
        SYSTEM_PROMPT = """
You are a professional, supportive AI interview agent.
On each turn you will receive exactly one of:
  • The candidate’s spoken text  
  • The token [EMPTY] if they said nothing for 10 s  
  • The token [SKIP] if they explicitly asked to skip  

Follow this state-machine exactly:
1. If the user’s message is non-empty, ask an adaptive follow-up question based on prior history, job role, and resume.
2. If message is [EMPTY] or [SKIP], gently move on and ask another relevant question.
Always ask one clear, professional, role-specific interview question per turn.
Make sure to ask balanced set of behavioral and technical (including fundamental concepts based of prior history, job role, and resume) while maintaining natural conversational flow.
Tone should be adapted based on recent behavior logs (e.g., supportive if the user appears disengaged).
"""

        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for m in req.history:
            messages.append({"role": m["role"], "content": m["content"]})
        messages.append({"role": "user", "content": req.user_input})

        # ─── Inject Resume Context ──────────────────────────────
        try:
            retriever = get_retriever(candidate_id=req.candidate_id)
            docs = retriever.get_relevant_documents(req.user_input)
            context = "\n".join(d.page_content for d in docs)
        except Exception as e:
            print(f"⚠️ Vector DB retrieval failed: {e}")
            context = ""
        messages.insert(1, {"role": "system", "content": f"Resume context:\n{context}"})

        # ─── Inject Candidate Tone ──────────────────────────────
        try:
            tone = await compute_tone(req.session_id)
            messages.insert(2, {"role": "system", "content": f"The candidate seems {tone}. Adjust your tone accordingly."})
        except:
            pass

        # ─── Query LLM ──────────────────────────────────────────
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.7,
        )
        next_q = response.choices[0].message.content

        # ─── Append Coaching Hint ──────────────────────────────
        try:
            coaching_hint = await get_hint(req.session_id)
            if coaching_hint:
                next_q += f"\n\n💡 Hint: {coaching_hint}"
        except Exception as e:
            print("⚠️ Coaching hint error:", e)

        # ─── Score Last Answer ─────────────────────────────────
        result = await score_answer(prev_q, req.user_input)
        await database.execute(
            interview_logs.insert().values(
                candidate_id=req.candidate_id,
                question=prev_q,
                answer=req.user_input,
                score=result["score"],
                subscores=result["subscores"],
                hallucination=result["hallucination"],
                timestamp=datetime.utcnow(),
            )
        )

        return {
            "answer": next_q,
            **result
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, f"/ask failed: {e}")
