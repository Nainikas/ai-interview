import sys
import os
import pytest
from httpx import AsyncClient
from httpx._transports.asgi import ASGITransport

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from main import app

@pytest.mark.asyncio
async def test_ask_endpoint_basic():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/interview/ask", json={
            "user_input": "I'm applying for a machine learning engineer role.",
            "history": [],
            "candidate_id": "test-candidate-1",
            "session_id": "test-candidate-1"
        })
        assert response.status_code == 200
        assert "answer" in response.json()
