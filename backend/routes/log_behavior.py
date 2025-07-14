# backend/routes/log_behavior.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from db import database, behavior_logs
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

VALID_EMOTIONS = {"happy", "neutral", "sad", "angry", "surprised", "disgusted", "fearful"}
VALID_GAZE = {"center", "left", "right", "up", "down", "away"}

class BehaviorLogIn(BaseModel):
    session_id:     str
    emotion:        str
    face_present:   bool
    gaze_direction: str

def compute_engagement_score(emotion: str, face_present: bool, gaze: str) -> float:
    score = 1.0
    if not face_present:
        score -= 0.5
    if emotion in {"sad", "angry", "disgusted"}:
        score -= 0.3
    if gaze in {"down", "away"}:
        score -= 0.2
    return max(0.0, min(1.0, score))

@router.post("/log-behavior")
async def log_behavior(entry: BehaviorLogIn):
    try:
        # Basic input validation
        if entry.emotion not in VALID_EMOTIONS:
            raise HTTPException(400, f"Invalid emotion: {entry.emotion}")
        if entry.gaze_direction not in VALID_GAZE:
            raise HTTPException(400, f"Invalid gaze direction: {entry.gaze_direction}")

        # Compute engagement score
        score = compute_engagement_score(entry.emotion, entry.face_present, entry.gaze_direction)

        # Log suspicious behavior
        if not entry.face_present or entry.gaze_direction in {"away", "down"}:
            logger.warning(f"[⚠] Suspicious behavior — session={entry.session_id}, gaze={entry.gaze_direction}, face={entry.face_present}")

        await database.execute(
            behavior_logs.insert().values(
                session_id       = entry.session_id,
                timestamp        = datetime.utcnow(),
                engagement_score = score,
                emotion          = entry.emotion,
                face_present     = entry.face_present,
                gaze_direction   = entry.gaze_direction,
            )
        )

        return {"status": "ok", "engagement_score": score}
    except Exception as e:
        logger.exception("Behavior log failed")
        raise HTTPException(500, f"Could not log behavior: {e}")
