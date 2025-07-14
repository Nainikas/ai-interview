# backend/routes/admin.py
from fastapi import APIRouter, Query, HTTPException
from db import database, interview_logs, behavior_logs
import sqlalchemy

router = APIRouter()

# 1) List all sessions (latest timestamp per candidate)
@router.get("/interview-sessions")
async def get_sessions():
    q = (
        sqlalchemy.select(
            interview_logs.c.candidate_id,
            sqlalchemy.func.max(interview_logs.c.timestamp).label("created_at"),
        )
        .group_by(interview_logs.c.candidate_id)
        .order_by(sqlalchemy.func.max(interview_logs.c.timestamp).desc())
    )
    rows = await database.fetch_all(q)
    return {
        "sessions": [
            {
                "id": r["candidate_id"],
                "candidate_name": r["candidate_id"],  # replace with real name once available
                "created_at": r["created_at"],
            }
            for r in rows
        ]
    }

# 2) Q&A log (only scored answers)
@router.get("/qa-log")
async def get_qa_log(candidate_id: str = Query(...)):
    q = (
        interview_logs.select()
        .where(interview_logs.c.candidate_id == candidate_id)
        .where(interview_logs.c.score.isnot(None))
        .order_by(interview_logs.c.timestamp.asc())
    )
    rows = await database.fetch_all(q)
    if not rows:
        raise HTTPException(404, "No scored answers found for this candidate.")
    return {
        "qa_log": [
            {
                "question": r["question"],
                "answer": r["answer"],
                "score": r["score"],
                "subscores": r["subscores"],
                "hallucination": r["hallucination"],
            }
            for r in rows
        ]
    }

# 3) Behavior logs (filter on session_id, not the non‐existent candidate_id)
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
            }
            for r in rows
        ]
    }
