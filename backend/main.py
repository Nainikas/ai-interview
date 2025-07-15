# backend/main.py

from dotenv import load_dotenv
load_dotenv()

import os
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ─── Routers ─────────────────────────────────────────────────────
from db import database
from routes.admin import router as admin_router
from routes.interview import router as interview_router
from routes.log_behavior import router as behavior_router
from routes.speak import router as speak_router
from routes.clarify_check import router as clarify_router

# ─── Logger Setup ───────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── FastAPI App ────────────────────────────────────────────────
app = FastAPI(
    title="AI Interview Agent",
    description="A personalized AI-powered voice interview backend with resume ingestion, scoring, behavioral analysis, and hallucination detection.",
    version="1.0.0"
)

# ─── CORS Config ────────────────────────────────────────────────
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip('/')

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        frontend_url,
        f"{frontend_url}/"
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Global Request Logger ──────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"➡️ {request.method} {request.url}")
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        logger.exception(f"❌ Error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

# ─── Router Registration ────────────────────────────────────────
app.include_router(interview_router, prefix="/interview", tags=["Interview Flow"])
app.include_router(behavior_router, prefix="/interview", tags=["Behavior Logs"])
app.include_router(admin_router, tags=["Admin Dashboard"])
app.include_router(speak_router, tags=["TTS"])
app.include_router(clarify_router, tags=["Clarify Check"])

# ─── Health Check ───────────────────────────────────────────────
@app.get("/", tags=["Health"])
def health_check():
    return {"status": "backend is running"}

# ─── Startup / Shutdown Events ──────────────────────────────────
@app.on_event("startup")
async def startup():
    logger.info("🚀 Connecting to database...")
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    logger.info("🛑 Disconnecting database...")
    await database.disconnect()
