# backend/behavior_logs.py

from db import database

async def get_recent(session_id: str, limit: int = 3):
    """
    Fetch the last `limit` engagement_score values for this session_id.
    Returns a list of floats.
    """
    query = """
        SELECT engagement_score
        FROM behavior_logs
        WHERE session_id = :sid
        ORDER BY timestamp DESC
        LIMIT :lim
    """
    rows = await database.fetch_all(query, {"sid": session_id, "lim": limit})
    # extract the floats
    return [r["engagement_score"] for r in rows]
