# backend/main.py

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import database
from routes.admin import router as admin_router
from routes.interview import router as interview_router
from routes.log_behavior import router as behavior_router
# from routes.feedback import router as feedback_router   # comment out until you add routes/feedback.py
# from routes.coaching_trigger import router as coaching_router
from routes.speak import router as speak_router
# from routes.clarify_check import router as clarify_router

app = FastAPI()

# CORS settings — update origins when you deploy
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # local React dev, switch to your Vercel domain later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers that exist
app.include_router(interview_router, prefix="/interview")
app.include_router(behavior_router)
app.include_router(admin_router, prefix="/admin")
# app.include_router(feedback_router, prefix="/feedback")
# app.include_router(coaching_router, prefix="/coaching-trigger")
app.include_router(speak_router)
# app.include_router(clarify_router, prefix="/clarify")

@app.get("/")
def health_check():
    return {"status": "backend is running"}

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()
