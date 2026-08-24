"""
Transcription via Groq's hosted Whisper endpoint.

Groq is used for both ASR and LLM calls deliberately — one SDK, one API key,
one less integration to debug under a tight timeline. whisper-large-v3-turbo
is fast enough that a 20-30 min meeting recording transcribes in a few seconds.
"""

import os
from groq import Groq

client = Groq(api_key=os.environ["GROQ_API_KEY"])


def transcribe_audio(file_path: str) -> str:
    """Takes a path to an audio file on disk, returns the raw transcript text.
    Caller is responsible for deleting the file afterwards — we don't persist audio.
    """
    with open(file_path, "rb") as f:
        transcription = client.audio.transcriptions.create(
            file=f,
            model="whisper-large-v3-turbo",
            response_format="text",
        )
    # response_format="text" returns a plain string directly
    return str(transcription)
