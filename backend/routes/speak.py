# backend/routes/speak.py

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import os, uuid, hashlib, time
import openai
import logging
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

router = APIRouter()
logger = logging.getLogger(__name__)

VALID_VOICES = {"alloy", "echo", "fable", "onyx", "nova", "shimmer"}
AUDIO_DIR = "./tts_cache"
os.makedirs(AUDIO_DIR, exist_ok=True)

class SpeechInput(BaseModel):
    text:  str
    voice: str = "alloy"

def clean_old_audio_files(threshold_seconds=600):
    now = time.time()
    for fname in os.listdir(AUDIO_DIR):
        path = os.path.join(AUDIO_DIR, fname)
        if os.path.isfile(path) and now - os.path.getmtime(path) > threshold_seconds:
            os.remove(path)

@router.post("/speak")
async def synthesize_speech(data: SpeechInput):
    try:
        text = data.text.strip()
        if not text:
            raise HTTPException(400, "Text input is empty.")
        if data.voice not in VALID_VOICES:
            raise HTTPException(400, f"Invalid voice: {data.voice}")

        # ─── Generate hash for caching ─────────────
        h = hashlib.sha256(f"{data.voice}:{text}".encode()).hexdigest()
        output_path = os.path.join(AUDIO_DIR, f"{h}.mp3")

        if os.path.exists(output_path):
            logger.info(f"[TTS] Cache hit for {h}")
            return FileResponse(output_path, media_type="audio/mpeg", filename="speech.mp3")

        logger.info(f"[TTS] Generating new audio for hash {h}")

        speech_response = openai.audio.speech.create(
            model="tts-1",
            voice=data.voice,
            input=text
        )

        with open(output_path, "wb") as f:
            f.write(speech_response.content)

        # Optionally clean old files
        clean_old_audio_files()

        return FileResponse(output_path, media_type="audio/mpeg", filename="speech.mp3")

    except Exception as e:
        logger.exception("TTS generation failed")
        return JSONResponse(status_code=500, content={"error": str(e)})
