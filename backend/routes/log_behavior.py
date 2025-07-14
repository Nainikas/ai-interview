# backend/routes/log_behavior.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from db import database, behavior_logs

router = APIRouter()

class BehaviorLogIn(BaseModel):
    session_id:    str
    emotion:       str
    face_present:  bool

@router.post("/log-behavior")
async def log_behavior(entry: BehaviorLogIn):
    try:
        # for now we just set engagement_score = 1.0
        await database.execute(
            behavior_logs.insert().values(
                session_id       = entry.session_id,
                timestamp        = datetime.utcnow(),
                engagement_score = 1.0,
                emotion          = entry.emotion,
                face_present     = entry.face_present,
            )
        )
        return {"status":"ok"}
    except Exception as e:
        raise HTTPException(500, f"Could not log behavior: {e}")
