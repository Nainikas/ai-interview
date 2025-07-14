# backend/agent.py

import os
from langchain_community.llms import OpenAI
from langchain.agents import initialize_agent, Tool   # agent API stays in core for now
from rag import get_retriever
from scoring import adaptive_score, check_hallucination
from behavior_logs import get_recent as fetch_engagement
from typing import List

# 1) Initialize the LLM
llm = OpenAI(temperature=0.7)

# 2) Retrieval tool
def resume_retriever(query: str):
    retriever = get_retriever(k=3)
    docs = retriever.get_relevant_documents(query)
    # return just the text for simplicity
    return [d.page_content for d in docs]

# 3) Scoring tool
def score_answer(answer: str):
    score = adaptive_score(answer)
    halluc = check_hallucination(answer)
    return {"score": score, "hallucination": halluc}

# 4) Define Tools
tools = [
    Tool(
        name="ResumeRetriever",
        func=resume_retriever,
        description="Fetches the top 3 relevant resume snippets for a query."
    ),
    Tool(
        name="ScoreAnswer",
        func=score_answer,
        description="Computes the candidate’s score and checks for hallucinations."
    )
]

# 5) Initialize the conversational agent
agent = initialize_agent(
    tools,
    llm,
    agent="conversational-react-description",
    verbose=True
)

# 6) Tone computation helper
async def compute_tone(session_id: str, limit: int = 3) -> str:
    """
    Fetch the last `limit` engagement scores and map to a tone.
    """
    scores: List[float] = await fetch_engagement(session_id, limit)
    if not scores:
        return "neutral"
    avg = sum(scores) / len(scores)
    return "confident" if avg > 0.8 else "hesitant"
