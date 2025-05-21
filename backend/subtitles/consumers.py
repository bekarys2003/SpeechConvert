import os
os.environ["TOKENIZERS_PARALLELISM"] = "false"

import json
import base64
import tempfile
import asyncio
import openai
import traceback
from pydub import AudioSegment
from channels.generic.websocket import AsyncWebsocketConsumer
from django.conf import settings
from transformers import pipeline
from google.cloud import translate_v2 as translate

# Initialize Hugging Face sentiment model once
sentiment_model = pipeline(
    "text-classification",
    model="bhadresh-savani/distilbert-base-uncased-emotion",
    top_k=None
)

# Initialize Google Translate client once
translator = translate.Client()

class SubtitleConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        tmp_audio_path = None
        converted_path = None

        try:
            openai.api_key = settings.OPENAI_API_KEY
            data = json.loads(text_data)

            base64_audio = data.get("audio")
            if not base64_audio or "webm" not in base64_audio:
                return

            audio_data = base64.b64decode(base64_audio.split(",")[1])
            if len(audio_data) < 1000:
                return

            with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp_audio:
                tmp_audio.write(audio_data)
                tmp_audio_path = tmp_audio.name

            with open(tmp_audio_path, "rb") as audio_file:
                transcript_resp = openai.audio.transcriptions.create(
                    file=audio_file,
                    model="whisper-1"
                )
            transcript = transcript_resp.text

            # ✅ Run translation and emotion detection in parallel
            async def run_translation():
                return translator.translate(transcript, target_language='ru')['translatedText']

            async def run_emotion():
                result = sentiment_model(transcript)
                return sorted(result[0], key=lambda x: x['score'], reverse=True)[0]['label']

            translation, top_emotion = await asyncio.gather(run_translation(), run_emotion())

            await self.send(text_data=json.dumps({
                "transcript": transcript,
                "translation": translation,
                "emotion": top_emotion
            }))

        except Exception as e:
            await self.send(text_data=json.dumps({"error": str(e)}))
            traceback.print_exc()

        finally:
            for path in [tmp_audio_path, converted_path]:
                if path and os.path.exists(path):
                    os.remove(path)
