# backend/routes/admin.py

from fastapi import APIRouter, Query, HTTPException
from db import database, interview_logs, behavior_logs, interview_sessions
import sqlalchemy

router = APIRouter()

# ─── 1) List all sessions (via interview_sessions table) ─────────────
@router.get("/interview-sessions")
async def get_sessions():
    q = (
        interview_sessions.select()
        .order_by(interview_sessions.c.created_at.desc())
    )
    rows = await database.fetch_all(q)
    return {
        "sessions": [
            {
                "id": r["id"],
                "candidate_name": r["candidate_name"] or r["id"],
                "job_role": r["job_role"],
                "resume_file": r["resume_file"],
                "created_at": r["created_at"],
            }
            for r in rows
        ]
    }

# ─── 2) Q&A log (optional: show all vs only scored) ─────────────────
@router.get("/qa-log")
async def get_qa_log(candidate_id: str = Query(...), include_unscored: bool = False):
    q = (
        interview_logs.select()
        .where(interview_logs.c.candidate_id == candidate_id)
        .order_by(interview_logs.c.timestamp.asc())
    )
    if not include_unscored:
        q = q.where(interview_logs.c.score.isnot(None))

    rows = await database.fetch_all(q)
    if not rows:
        raise HTTPException(404, "No answers found for this candidate.")
    return {
        "qa_log": [
            {
                "question": r["question"],
                "answer": r["answer"],
                "score": r["score"],
                "subscores": r["subscores"],
                "hallucination": r["hallucination"],
                "timestamp": r["timestamp"].isoformat()
            }
            for r in rows
        ]
    }

# ─── 3) Behavior logs ───────────────────────────────────────────────
@router.get("/behavior-logs")
async def get_behavior_logs(candidate_id: str = Query(...)):
    q = (
        behavior_logs.select()
        .where(behavior_logs.c.session_id == candidate_id)
        .order_by(behavior_logs.c.timestamp.asc())
    )
    rows = await database.fetch_all(q)
    return {
        "logs": [
            {
                "timestamp": r["timestamp"].isoformat(),
                "emotion": r["emotion"],
                "face_present": r["face_present"],
                "gaze_direction": r["gaze_direction"]
            }
            for r in rows
        ]
    }
