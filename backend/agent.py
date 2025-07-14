# backend/agent.py

import os
from typing import List

from langchain.agents import initialize_agent, Tool
from langchain.memory import ConversationBufferMemory
from langchain_openai import ChatOpenAI
from langchain.agents.agent_types import AgentType
from rag import get_retriever
from scoring import adaptive_score, score_answer
from behavior_logs import get_recent as fetch_engagement

# ─── 1) LLM Setup ─────────────────────────────────────────────
llm = ChatOpenAI(temperature=0.7, model="gpt-4o")

# ─── 2) Memory for Personalization ────────────────────────────
memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

# ─── 3) Resume Retrieval Tool ─────────────────────────────────
def make_resume_tool(candidate_id: str):
    retriever = get_retriever(candidate_id)
    def fetch(query: str):
        docs = retriever.get_relevant_documents(query)
        return "\n".join(d.page_content for d in docs)
    return Tool(
        name="ResumeRetriever",
        func=fetch,
        description="Useful for pulling relevant experience or keywords from the candidate's resume."
    )

# ─── 4) Agent Initialization Function ─────────────────────────
def build_interview_agent(candidate_id: str):
    resume_tool = make_resume_tool(candidate_id)

    return initialize_agent(
        tools=[resume_tool],
        llm=llm,
        agent=AgentType.CONVERSATIONAL_REACT_DESCRIPTION,
        memory=memory,
        verbose=True
    )

# ─── 5) Adaptive Tone Computation ─────────────────────────────
async def compute_tone(session_id: str, limit: int = 3) -> str:
    scores: List[float] = await fetch_engagement(session_id, limit)
    if not scores:
        return "neutral"
    avg = sum(scores) / len(scores)
    return (
        "confident" if avg > 0.85 else
        "hesitant"  if avg > 0.5 else
        "nervous"
    )
