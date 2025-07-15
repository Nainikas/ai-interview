# backend/routes/interview.py

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime

from db import database, interview_logs, interview_sessions
from scoring import score_answer, compute_tone

router = APIRouter()

# ─── Request/Response Models ─────────────────────────────────────
class Message(BaseModel):
    role: str
    content: str

class InterviewRequest(BaseModel):
    history: List[Message]
    candidate_id: str
    session_id: str
    user_input: str

class InterviewResponse(BaseModel):
    answer: str
    score: float
    subscores: Dict[str, float]
    hallucination: str

# ─── Dummy LLM (replace with real agent) ─────────────────────────
from openai import OpenAI
client = OpenAI()

SYSTEM_PROMPT = """
You are a professional, supportive AI interview agent. On each turn you will receive exactly one of:
  • The candidate’s spoken text  
  • The token [EMPTY] if they said nothing for 10 s (or 6 s after your silence prompt)  
  • The token [SKIP] if they explicitly asked to skip or move on  

Follow this state-machine **exactly**:

1. **First turn only**:  
   - If the user’s message is non-empty, proceed normally.  
   - If empty, ask once:  
     “Which role are you applying for?”  
     then ask:  
     “Please give me a brief introduction of your previous work experience, education, and key skills.”  

2. **Subsequent turns**:  
   - If user input is [EMPTY]: say “It seems you were quiet. Would you like me to repeat the last question?” → wait → if still empty, say “Let’s move on to the next question.”
   - If user input is [SKIP]: skip feedback and go to next question.
   - If non-empty: give brief coaching if needed, then ask the next question.

Interview must balance behavioral and technical questions.
Always keep a warm, professional tone.
"""

# ─── Route: Start Session ───────────────────────────────────────
@router.post("/interview/start-session")
async def start_session():
    from uuid import uuid4
    session_id = str(uuid4())
    await database.execute(interview_sessions.insert().values(
        id=session_id,
        created_at=datetime.utcnow()
    ))
    return {"session_id": session_id}

# ─── Route: Interview Q&A ────────────────────────────────────────
@router.post("/interview/ask", response_model=InterviewResponse)
async def interview(request: InterviewRequest):
    try:
        # Extract latest user input
        last_user_msg = next((m.content for m in reversed(request.history) if m.role == "user"), "")

        # Derive tone from behavior logs
        tone = await compute_tone(request.session_id)

        # Construct prompt history
        chat_history = [{"role": "system", "content": SYSTEM_PROMPT}]
        for msg in request.history:
            chat_history.append({"role": msg.role, "content": msg.content})

        # Call OpenAI for next assistant message
        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=chat_history,
            temperature=0.7,
            max_tokens=300
        )
        response_text = completion.choices[0].message.content.strip()

        #  Fetch resume from DB to use in scoring
        row = await database.fetch_one(
            interview_sessions.select().where(interview_sessions.c.id == request.session_id)
        )
        resume_text = row["resume_file"] if row and row["resume_file"] else ""

        #  Score answer using resume context
        result = await score_answer(
            question=request.history[-1].content if request.history else "",
            answer=last_user_msg,
            resume=resume_text
        )

        # Log Q&A to database
        await database.execute(interview_logs.insert().values(
            candidate_id=request.session_id,
            question=request.history[-1].content if request.history else None,
            answer=last_user_msg,
            score=result["score"],
            subscores=result["subscores"],
            hallucination=result["hallucination"],
            timestamp=datetime.utcnow()
        ))

        return InterviewResponse(
            answer=response_text,
            score=result["score"],
            subscores=result["subscores"],
            hallucination=result["hallucination"]
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Interview failed: {str(e)}")
