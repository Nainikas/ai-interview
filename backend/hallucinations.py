# hallucinations.py

from openai import OpenAI
from rag import get_retriever

import os
import traceback

client = OpenAI()

async def check_hallucination(question: str, user_answer: str, candidate_id: str) -> str:
    """
    Checks if the candidate's answer is hallucinated, lightly grounded in resume content.
    
    Returns:
        "Yes" → likely hallucinated
        "No" → likely accurate
        "Uncertain" → can't determine
    """
    try:
        # Optional: inject relevant resume context
        resume_context = ""
        try:
            retriever = get_retriever(candidate_id)
            docs = retriever.get_relevant_documents(question + " " + user_answer)
            resume_context = "\n\n".join([d.page_content for d in docs[:3]])  # limit to 3 chunks
        except Exception as e:
            print("⚠️ Resume grounding skipped:", e)

        prompt = f"""
You are a precise fact-checking AI for technical interviews.

Below is a candidate's answer to a question, and optionally, relevant content from their resume to help you assess.

--- Interview Question ---
{question}

--- Candidate's Answer ---
{user_answer}

--- Resume Context (optional) ---
{resume_context or '[None provided]'}

Does the candidate’s answer contain factual inaccuracies, hallucinations, or made-up content?

Reply with one of the following only:
- Yes
- No
- Uncertain
"""

        response = await client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
        )

        result = response.choices[0].message.content.strip().lower()

        if "yes" in result:
            return "Yes"
        elif "no" in result:
            return "No"
        elif "uncertain" in result:
            return "Uncertain"
        else:
            return "Uncertain"

    except Exception as e:
        print("❌ Hallucination check failed:", e)
        traceback.print_exc()
        return "Uncertain"
