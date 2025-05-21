import os
os.environ["TOKENIZERS_PARALLELISM"] = "false"

import json
import base64
import tempfile
import asyncio
import traceback
from channels.generic.websocket import AsyncWebsocketConsumer
from django.conf import settings
from transformers import pipeline
from google.cloud import translate_v2 as translate
from faster_whisper import WhisperModel

sentiment_model = pipeline(
    "text-classification",
    model="bhadresh-savani/distilbert-base-uncased-emotion",
    top_k=None
)

translator = translate.Client()


whisper_model = WhisperModel("base", compute_type="auto")

class SubtitleConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        tmp_audio_path = None

        try:
            data = json.loads(text_data)

            base64_audio = data.get("audio")
            target_lang = data.get("lang", "ru")
            allowed_langs = {"ru", "fr", "de", "es", "zh", "ja"}
            if target_lang not in allowed_langs:
                target_lang = "ru"
            if not base64_audio or "webm" not in base64_audio:
                return

            audio_data = base64.b64decode(base64_audio.split(",")[1])
            if len(audio_data) < 1000:
                return

            with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp_audio:
                tmp_audio.write(audio_data)
                tmp_audio_path = tmp_audio.name

            segments, _ = whisper_model.transcribe(tmp_audio_path)
            transcript = " ".join([segment.text.strip() for segment in segments])

            async def run_translation():
                return translator.translate(transcript, target_language=target_lang)['translatedText']

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
            if tmp_audio_path and os.path.exists(tmp_audio_path):
                os.remove(tmp_audio_path)
