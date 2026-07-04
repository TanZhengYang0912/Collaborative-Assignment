import whisper
import torch
from pathlib import Path

# Limit Whisper to 4 CPU threads (out of 10 available on this Mac).
# Without this, Whisper monopolizes all cores during batch transcription,
# which starves yt-dlp of CPU and makes "Fetch Videos" feel frozen.
torch.set_num_threads(4)


_model = None


def get_model(model_size: str = "small"):
    global _model
    if _model is None:
        _model = whisper.load_model(model_size)
    return _model


def transcribe_audio(audio_path: str, model_size: str = "small") -> dict:
    """
    Transcribe audio file using OpenAI Whisper.
    Returns dict with text, language, segments.
    """
    model = get_model(model_size)

    try:
        result = model.transcribe(
            audio_path,
            task="transcribe",
            verbose=False,
            fp16=False,  # Use fp32 for compatibility on Mac
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
