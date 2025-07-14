# backend/routes/speak.py

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import os, uuid
import openai
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

router = APIRouter()

class SpeechInput(BaseModel):
    text:  str
    voice: str = "alloy"  # Available: alloy, echo, fable, onyx, nova, shimmer

@router.post("/speak")
async def synthesize_speech(data: SpeechInput):
    try:
        output_filename = f"output_{uuid.uuid4().hex}.mp3"
        speech_response = openai.audio.speech.create(
            model="tts-1",
            voice=data.voice,
            input=data.text
        )
        # write the binary content
        with open(output_filename, "wb") as f:
            f.write(speech_response.content)
        return FileResponse(output_filename, media_type="audio/mpeg", filename=output_filename)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
