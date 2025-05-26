import os
os.environ["TOKENIZERS_PARALLELISM"] = "false"

import json
import base64
import tempfile
import asyncio
import traceback
import subprocess
import time
from pathlib import Path
from channels.generic.websocket import AsyncWebsocketConsumer
from transformers import pipeline
from google.cloud import translate_v2 as translate
from faster_whisper import WhisperModel


BASE_DIR = Path(__file__).resolve().parent.parent
FFMPEG_PATH = str(BASE_DIR / "bin" / "ffmpeg")

if not Path(FFMPEG_PATH).exists():
    raise EnvironmentError("Bundled FFmpeg binary not found at expected path.")

sentiment_model = pipeline("text-classification", model="bhadresh-savani/distilbert-base-uncased-emotion", top_k=None)
translator = translate.Client()
whisper_model = WhisperModel("tiny", compute_type="int8")

def convert_to_wav(input_path, output_path):
    command = [
        FFMPEG_PATH,
        "-y",
        "-i", input_path,
        "-ac", "1",
        "-ar", "16000",
        "-af", "loudnorm",
        "-c:a", "pcm_s16le",
        output_path,
    ]
    result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg failed: {result.stderr.decode()}")

def blocking_translate(text, lang):
    return translator.translate(text, target_language=lang)['translatedText']

class SubtitleConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        tmp_audio_path = None
        converted_audio_path = None

        try:
            data = json.loads(text_data)

            base64_audio = data.get("audio")
            target_lang = data.get("lang", "ru")
            do_translate = data.get("translate", True)
            do_emotion = data.get("detectEmotion", True)

            if not base64_audio:
                return

            try:
                mime_type = base64_audio.split(";")[0].split(":")[-1]
                format_hint = mime_type.split("/")[-1]
                if format_hint == "mpeg":
                    format_hint = "mp3"
                if format_hint not in ["webm", "mp3", "wav", "ogg"]:
                    raise ValueError("Unsupported format")
            except Exception:
                await self.send(text_data=json.dumps({"error": "Cannot determine audio format"}))
                return

            audio_data = base64.b64decode(base64_audio.split(",")[1])
            if len(audio_data) < 1000:
                return

            with tempfile.NamedTemporaryFile(delete=False, suffix=f".{format_hint}", mode="wb") as tmp_audio:
                tmp_audio.write(audio_data)
                tmp_audio.flush()
                os.fsync(tmp_audio.fileno())
                tmp_audio_path = tmp_audio.name

            time.sleep(0.1)

            converted_audio_path = tmp_audio_path + ".wav"
            convert_to_wav(tmp_audio_path, converted_audio_path)

            segments, _ = whisper_model.transcribe(converted_audio_path)
            transcript = " ".join([segment.text.strip() for segment in segments])

            # Run optional features in threads
            tasks = []

            if do_translate:
                async def run_translate():
                    return await asyncio.to_thread(blocking_translate, transcript, target_lang)
                tasks.append(run_translate())

            if do_emotion:
                tasks.append(asyncio.to_thread(sentiment_model, transcript))

            results = await asyncio.gather(*tasks)

            response = {"transcript": transcript}
            result_index = 0

            if do_translate:
                response["translation"] = results[result_index]
                result_index += 1

            if do_emotion:
                emotions = results[result_index]
                top_emotion = sorted(emotions[0], key=lambda x: x['score'], reverse=True)[0]['label']
                response["emotion"] = top_emotion

            await self.send(text_data=json.dumps(response))

        except Exception as e:
            await self.send(text_data=json.dumps({"error": str(e)}))
            traceback.print_exc()

        finally:
            for path in [tmp_audio_path, converted_audio_path]:
                if path and os.path.exists(path):
                    os.remove(path)
