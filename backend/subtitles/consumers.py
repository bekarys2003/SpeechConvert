import os
os.environ["TOKENIZERS_PARALLELISM"] = "false"  # Suppress tokenizer warning

import json
import base64
import tempfile
import openai
import mimetypes
import traceback
from pydub import AudioSegment
from channels.generic.websocket import AsyncWebsocketConsumer
from django.conf import settings
from transformers import pipeline

# Load Hugging Face model once
sentiment_model = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base",
    top_k=None
)

class SubtitleConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        print("✅ WebSocket connected")

    async def disconnect(self, close_code):
        print("❌ WebSocket disconnected")

    async def receive(self, text_data):
        tmp_audio_path = None
        converted_path = None
        try:
            print("🔵 WebSocket received message")
            openai.api_key = settings.OPENAI_API_KEY

            data = json.loads(text_data)
            if "ping" in data:
                return

            base64_audio = data.get("audio")
            if not base64_audio:
                print("⚠️ No audio received")
                return

            # Detect MIME type
            mime_prefix = base64_audio.split(";")[0]
            mime_type = mime_prefix.split("data:")[1] if "data:" in mime_prefix else None
            print("📎 Detected MIME type:", mime_type)
            if not mime_type or "webm" not in mime_type:
                raise ValueError("Unsupported or missing MIME type")

            # Decode and save .webm
            audio_data = base64.b64decode(base64_audio.split(",")[1])
            if len(audio_data) < 1000:
                print("⚠️ Skipping short or empty audio chunk")
                return

            with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp_audio:
                tmp_audio.write(audio_data)
                tmp_audio_path = tmp_audio.name

            # Convert .webm to .wav
            converted_path = tmp_audio_path.replace(".webm", ".wav")
            audio_segment = AudioSegment.from_file(tmp_audio_path, format="webm")
            audio_segment.export(converted_path, format="wav")

            print("🎙️ Sending to Whisper (converted .wav)")
            with open(converted_path, "rb") as audio_file:
                transcript_resp = openai.audio.transcriptions.create(
                    file=audio_file,
                    model="whisper-1"
                )

            transcript = transcript_resp.text
            print("🧠 Whisper transcript:", transcript)

            print("🌍 Translating with ChatGPT")
            translated_resp = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Translate to Russian"},
                    {"role": "user", "content": transcript}
                ]
            )
            translation = translated_resp.choices[0].message.content

            print("😐 Running emotion detection")
            emotion_result = sentiment_model(transcript)
            top_emotion = sorted(emotion_result[0], key=lambda x: x['score'], reverse=True)[0]['label']

            print("📤 Sending back to frontend")
            await self.send(text_data=json.dumps({
                "transcript": transcript,
                "translation": translation,
                "emotion": top_emotion
            }))

        except Exception as e:
            print("❌ Exception in receive():", e)
            traceback.print_exc()
            await self.send(text_data=json.dumps({"error": str(e)}))

        finally:
            for path in [tmp_audio_path, converted_path]:
                if path and os.path.exists(path):
                    os.remove(path)
