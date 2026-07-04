import subprocess
import os
import re
import json
from pathlib import Path


OUTPUTS_DIR = Path(__file__).parent.parent / "outputs"
OUTPUTS_DIR.mkdir(exist_ok=True)


def sanitize_filename(name: str) -> str:
    return re.sub(r'[^\w\-_.]', '_', name)


def _has_audio_stream(file_path: Path) -> bool:
    """Return True if the file has at least one audio stream."""
    result = subprocess.run(
        [
            "ffprobe", "-v", "quiet",
            "-select_streams", "a",          # audio streams only
            "-show_entries", "stream=codec_type",
            "-of", "csv=p=0",
            str(file_path),
        ],
        capture_output=True,
        text=True,
    )
    return bool(result.stdout.strip())


def _yt_dlp_download(url: str, output_path: Path, fmt: str,
                     impersonate: bool = True) -> subprocess.CompletedProcess:
    """Run yt-dlp to download a single format into output_path."""
    cmd = [
        "yt-dlp",
        "--no-playlist",
        "--no-check-formats",
        "--format", fmt,
        "--output", str(output_path),
        "--write-info-json",
        "--no-write-thumbnail",
    ]
    if impersonate:
        cmd += ["--impersonate", "chrome"]
    cmd += [
        "--user-agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        url,
    ]
    return subprocess.run(cmd, capture_output=True, text=True, timeout=300)


def download_audio(url: str, job_id: str) -> dict:
    """
    Download audio from a TikTok or YouTube URL and convert to MP3.

    Strategy:
      1. Try multiple yt-dlp format selectors in order of reliability.
         After each download we verify the file actually contains an audio
         stream — TikTok's metadata lies: both -0 and -1 variants advertise
         'aac' but -1 is video-only. The 'download' format (watermarked) is
         always combined h264+aac and is the most reliable primary choice.
         The watermark is on the VIDEO stream; we discard video with -vn.
      2. Once a file with audio is obtained, ffmpeg converts it to MP3.
         We call ffmpeg directly (not via yt-dlp's postprocessor) to avoid
         the ffprobe codec-check step that fails on TikTok streams.

    Returns dict with audio_path, title, thumbnail.
    """
    job_dir = OUTPUTS_DIR / job_id
    job_dir.mkdir(exist_ok=True)

    raw_video  = job_dir / "raw_video.mp4"
    output_mp3 = job_dir / "audio.mp3"

    # ── Format fallback list ──────────────────────────────────────────────────
    # Each entry is tried in order; we stop at the first one that produces a
    # file containing a real audio stream.
    FORMAT_FALLBACKS = [
        # 1. TikTok's own "download" stream — always h264 + AAC, never video-only
        "download",
        # 2. Any mp4 that explicitly has both video and audio codec set
        "best[vcodec!=none][acodec!=none][ext=mp4]",
        # 3. Widened search — any container with both streams
        "best[vcodec!=none][acodec!=none]",
        # 4. Last resort: whatever yt-dlp considers best
        "best",
    ]

    last_error = "No formats attempted"
    downloaded_file: Path | None = None

    for fmt in FORMAT_FALLBACKS:
        # Clean up any leftover from previous attempt
        for old in job_dir.glob("raw_video.*"):
            try:
                old.unlink()
            except Exception:
                pass

        dl = _yt_dlp_download(url, raw_video, fmt)

        # yt-dlp may use a different extension even if we specify .mp4
        actual_file = raw_video
        if not actual_file.exists():
            candidates = [
                f for f in job_dir.glob("raw_video.*")
                if f.suffix.lower() not in (".json", ".part")
            ]
            if candidates:
                actual_file = candidates[0]

        if dl.returncode != 0 or not actual_file.exists():
            last_error = dl.stderr[-300:] if dl.stderr else "Download failed"
            continue

        if _has_audio_stream(actual_file):
            downloaded_file = actual_file
            break
        else:
            last_error = (
                f"Format '{fmt}' downloaded a video-only file (no audio stream). "
                "Trying next format…"
            )

    if downloaded_file is None:
        raise RuntimeError(
            f"yt-dlp could not obtain a file with an audio stream. "
            f"Last error: {last_error}"
        )

    # ── Convert to MP3 with ffmpeg directly ───────────────────────────────────
    cmd_ff = [
        "ffmpeg",
        "-y",                           # overwrite output
        "-i", str(downloaded_file),     # input: downloaded container
        "-vn",                          # discard video (watermark irrelevant)
        "-acodec", "libmp3lame",        # encode as MP3
        "-q:a", "0",                    # VBR highest quality
        str(output_mp3),
    ]

    ff_result = subprocess.run(cmd_ff, capture_output=True, text=True, timeout=120)

    # Clean up raw video to save disk space
    try:
        downloaded_file.unlink(missing_ok=True)
    except Exception:
        pass

    if ff_result.returncode != 0:
        raise RuntimeError(f"ffmpeg conversion failed: {ff_result.stderr[-400:]}")

    if not output_mp3.exists():
        raise RuntimeError("MP3 file not found after ffmpeg conversion.")

    # ── Read metadata from info json ──────────────────────────────────────────
    title = "Unknown Title"
    thumbnail = None
    info_files = list(job_dir.glob("*.info.json"))
    if info_files:
        with open(info_files[0], "r", encoding="utf-8") as f:
            info = json.load(f)
        title = info.get("title", "Unknown Title")
        thumbnail = info.get("thumbnail", None)

    return {
        "audio_path": str(output_mp3),
        "title": title,
        "thumbnail": thumbnail,
    }


def validate_url(url: str) -> dict:
    """
    Validate whether a URL is a supported TikTok or YouTube single video or profile.
    Returns {"valid": bool, "platform": str, "url_type": "video"|"profile", "error": str}
    """
    url = url.strip()

    youtube_video_patterns = [
        r"(https?://)?(www\.)?(youtube\.com/watch\?v=|youtu\.be/|youtube\.com/shorts/)",
    ]
    youtube_profile_patterns = [
        r"(https?://)?(www\.)?youtube\.com/@[\w.]+/?$",
        r"(https?://)?(www\.)?youtube\.com/channel/[\w-]+/?$",
        r"(https?://)?(www\.)?youtube\.com/c/[\w-]+/?$",
        r"(https?://)?(www\.)?youtube\.com/user/[\w-]+/?$",
    ]
    tiktok_video_patterns = [
        r"(https?://)?(www\.)?(tiktok\.com/@.+/video/|vm\.tiktok\.com/|vt\.tiktok\.com/)",
    ]
    tiktok_profile_patterns = [
        r"(https?://)?(www\.)?tiktok\.com/@[\w.]+/?$",
    ]

    for pattern in youtube_video_patterns:
        if re.search(pattern, url, re.IGNORECASE):
            return {"valid": True, "platform": "YouTube", "url_type": "video", "error": None}

    for pattern in youtube_profile_patterns:
        if re.search(pattern, url, re.IGNORECASE):
            return {"valid": True, "platform": "YouTube", "url_type": "profile", "error": None}

    for pattern in tiktok_video_patterns:
        if re.search(pattern, url, re.IGNORECASE):
            return {"valid": True, "platform": "TikTok", "url_type": "video", "error": None}

    for pattern in tiktok_profile_patterns:
        if re.search(pattern, url, re.IGNORECASE):
            return {"valid": True, "platform": "TikTok", "url_type": "profile", "error": None}

    return {"valid": False, "platform": None, "url_type": None, "error": "URL must be a valid TikTok or YouTube video or profile link"}


def scrape_profile(url: str, start: int = 1, end: int = 10) -> list:
    """
    Scrape a TikTok or YouTube profile/channel using yt-dlp --flat-playlist.
    Returns a list of video metadata dicts (no download).
    Each dict: { id, url, title, thumbnail, duration, view_count }

    Uses --playlist-items start-end (e.g. "1-5") which is yt-dlp's most
    efficient range selector: it stops fetching API pages as soon as the
    requested items are collected, rather than walking the full playlist.
    """
    start = max(1, int(start))
    end = max(start, min(1000, int(end)))  # clamp max to 1000
    # Build a yt-dlp item range string like "1-10"
    playlist_items = f"{start}-{end}"

    cmd = [
        "yt-dlp",
        "--flat-playlist",
        # --playlist-items stops as soon as the requested items are found —
        # much faster than --playlist-start/end which always walks all pages.
        "--playlist-items", playlist_items,
        "--print", "%(.{id,webpage_url,title,thumbnail,duration,view_count})j",
        "--no-warnings",
        # Use TikTok's mobile API — faster and less anti-bot friction
        "--extractor-args", "tiktok:app_name=trill;device_platform=android;app_version=34.1.2",
        # Reduce wait time on unresponsive connections
        "--socket-timeout", "10",
        # Fail fast — don't retry on network errors
        "--retries", "1",
        "--fragment-retries", "0",
        # Impersonate a real browser to reduce TikTok anti-bot friction
        "--impersonate", "chrome",
        "--user-agent", "Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        url,
    ]

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        timeout=120,  # 2 min max — flat-playlist for a small range should be fast
    )

    if result.returncode != 0:
        raise RuntimeError(f"yt-dlp profile scrape failed: {result.stderr[:500]}")

    videos = []
    for line in result.stdout.strip().splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            entry = json.loads(line)
            video_url = entry.get("webpage_url") or entry.get("url") or ""
            if not video_url:
                continue
            # Ensure absolute URL
            if not video_url.startswith("http"):
                if "tiktok.com" in url:
                    video_url = "https://www.tiktok.com" + video_url
                elif "youtube.com" in url or "youtu.be" in url:
                    vid_id = entry.get("id", "")
                    video_url = f"https://www.youtube.com/watch?v={vid_id}" if vid_id else video_url

            duration = entry.get("duration")
            duration_str = None
            if duration:
                mins = int(duration) // 60
                secs = int(duration) % 60
                duration_str = f"{mins}:{secs:02d}"

            videos.append({
                "id": entry.get("id", ""),
                "url": video_url,
                "title": entry.get("title", "Untitled"),
                "thumbnail": entry.get("thumbnail"),
                "duration": duration_str,
                "view_count": entry.get("view_count"),
            })
        except (json.JSONDecodeError, Exception):
            continue

    return videos

