# backend/tone.py

from db import database, interview_logs

async def compute_tone(session_id: str) -> str:
    query = interview_logs.select().where(interview_logs.c.candidate_id == session_id)
    logs = await database.fetch_all(query)

    if not logs:
        return "neutral"

    answers = [row["answer"] for row in logs if row["answer"]]
    text = " ".join(answers).lower()

    if any(word in text for word in ["stress", "worried", "difficult", "confused"]):
        return "nervous"
    elif any(word in text for word in ["excited", "confident", "happy", "sure"]):
        return "confident"
    else:
        return "neutral"
