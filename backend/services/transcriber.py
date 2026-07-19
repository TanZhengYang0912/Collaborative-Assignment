import whisper
import torch
import os
import unicodedata
from collections import Counter
from threading import Lock
from pathlib import Path

# Limit Whisper to 4 CPU threads (out of 10 available on this Mac).
# Without this, Whisper monopolizes all cores during batch transcription,
# which starves yt-dlp of CPU and makes "Fetch Videos" feel frozen.
torch.set_num_threads(4)


_model = None
_model_lock = Lock()
WHISPER_LANGUAGE = os.getenv("WHISPER_LANGUAGE", "ms").strip() or "ms"
DOMAIN_PROMPT = (
    "Malay and English food recommendation from Melaka, Malaysia. "
    "Keep vendor names, dish names, locations, and Malaysian place names."
)


def get_model(model_size: str = "small"):
    global _model
    if _model is None:
        _model = whisper.load_model(model_size)
    return _model


def _build_transcription_options(language: str | None = None) -> dict:
    return {
        "task": "transcribe",
        "language": (language or WHISPER_LANGUAGE).strip().lower(),
        "initial_prompt": DOMAIN_PROMPT,
        "condition_on_previous_text": False,
        "temperature": 0,
        "verbose": False,
        "fp16": False,
    }


def _is_unreliable_transcript(segments: list[dict]) -> bool:
    texts = [" ".join(str(segment.get("text") or "").split()) for segment in segments]
    texts = [text for text in texts if text]
    if not texts:
        return True

    counts = Counter(texts)
    most_common_text, most_common_count = counts.most_common(1)[0]
    if len(texts) >= 4 and most_common_count / len(texts) >= 0.6 and len(most_common_text.split()) >= 3:
        return True

    full_text = " ".join(texts)
    alphabetic = [char for char in full_text if char.isalpha()]
    non_latin = [
        char for char in alphabetic
        if "LATIN" not in unicodedata.name(char, "")
    ]
    return len(alphabetic) >= 8 and len(non_latin) / len(alphabetic) > 0.25


def transcribe_audio(
    audio_path: str,
    model_size: str = "small",
    language: str | None = None,
) -> dict:
    """
    Transcribe audio file using OpenAI Whisper.
    Returns dict with text, language, segments.
    """
    model = get_model(model_size)

    try:
        # Whisper's model object is shared by the FastAPI worker. Serializing
        # inference prevents concurrent jobs from corrupting one another's
        # language detection/decoding state.
        with _model_lock:
            result = model.transcribe(audio_path, **_build_transcription_options(language))
        if _is_unreliable_transcript(result.get("segments", [])):
            raise RuntimeError(
                "Whisper produced an unreliable transcript. The audio may not contain clear speech; retry the job."
            )
    except Exception as e:
        error_msg = str(e)
        # These specific PyTorch errors typically happen when audio is silent, 
        # too short, corrupted, or when downloading a TikTok photo slideshow.
        if "0 elements" in error_msg or "Linear" in error_msg or "Categorical" in error_msg or "nan" in error_msg:
            # Return empty transcription to allow pipeline to continue with video title
            return {
                "text": "",
                "language": "unknown",
                "segments": []
            }
        else:
            raise RuntimeError(f"Transcription failed: {error_msg}")

    return {
        "text": result["text"].strip(),
        "language": result.get("language", "en"),
        "segments": [
            {
                "start": seg["start"],
                "end": seg["end"],
                "text": seg["text"].strip(),
            }
            for seg in result.get("segments", [])
        ],
    }
