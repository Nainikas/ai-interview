# backend/coaching_trigger.py

from db import database, behavior_logs
from sqlalchemy import desc
import random

COACHING_HINTS = [
    "Try to give a structured response using the STAR method.",
    "Focus on measurable outcomes when describing your work.",
    "Speak with confidence—even if you're unsure, walk through your thought process.",
    "Highlight teamwork and collaboration if the question allows it.",
    "If unsure, describe how you would approach solving the problem.",
]

async def get_hint(session_id: str) -> str:
    try:
        # Fetch the last few behavior logs
        query = behavior_logs.select().where(behavior_logs.c.session_id == session_id).order_by(desc(behavior_logs.c.timestamp)).limit(3)
        logs = await database.fetch_all(query)

        if not logs:
            return ""

        # If recent engagement scores are low, return a helpful hint
        avg_score = sum(l["engagement_score"] for l in logs) / len(logs)
        if avg_score < 0.6:
            return random.choice(COACHING_HINTS)

        return ""
    except Exception as e:
        print("⚠️ get_hint failed:", e)
        return ""
