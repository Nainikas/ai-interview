# backend/behavior_logs.py

from db import database
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)

# ─── Helper: Engagement Scoring ────────────────────────────────
def compute_engagement_score(row: Dict) -> float:
    score = 1.0

    if not row.get("face_present"):
        score -= 0.5
    if row.get("emotion") in ["neutral", "sad", "angry", "disgusted"]:
        score -= 0.3
    if row.get("gaze_direction") in ["away", "down"]:
        score -= 0.2

    return max(0.0, min(1.0, score))

# ─── Used by /agent.py → compute_tone ───────────────────────────
async def get_recent(session_id: str, limit: int = 3) -> List[float]:
    """
    Fetch the last `limit` engagement rows and compute score from emotion/gaze/face.
    """
    query = """
        SELECT engagement_score, emotion, face_present, gaze_direction
        FROM behavior_logs
        WHERE session_id = :sid
        ORDER BY timestamp DESC
        LIMIT :lim
    """
    try:
        rows = await database.fetch_all(query, {"sid": session_id, "lim": limit})
        return [compute_engagement_score(r) for r in rows]
    except Exception as e:
        logger.warning(f"Failed to fetch engagement logs: {e}")
        return []
