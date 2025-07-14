# backend/routes/clarify_check.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI

router = APIRouter()
client = OpenAI()

class ClarifyCheckRequest(BaseModel):
    user_input: str
    question: str

@router.post("/clarify-check")
async def clarify_check(req: ClarifyCheckRequest):
    try:
        prompt = f"""
You are a strict intent classifier for interview candidates.

Given the interview question and the candidate’s response, classify their intent as:

- "clarify" → asking to rephrase or simplify the question
- "teach" → asking the AI to explain the answer
- "other" → normal answer or unrelated

Respond with a single word only: clarify, teach, or other.

Question: {req.question}
User Input: {req.user_input}
"""

        resp = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "system", "content": "Classify user intent."},
                      {"role": "user", "content": prompt}],
            temperature=0,
        )
        intent = resp.choices[0].message.content.strip().lower()

        if intent not in ("clarify", "teach", "other"):
            intent = "other"

        return {"type": intent}
    except Exception as e:
        raise HTTPException(500, f"clarify-check failed: {e}")
