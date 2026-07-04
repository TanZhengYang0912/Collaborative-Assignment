import uuid
import json
import asyncio
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import Optional

from services.downloader import download_audio, validate_url, scrape_profile
from services.transcriber import transcribe_audio
from services.summarizer import summarize_transcript
from services.extractor import extract_info

router = APIRouter()

# Dedicated thread pool for profile scraping — isolated from batch pipeline threads
# so "Fetch Videos" is always fast even when a large batch is running.
_scrape_executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="scrape")

OUTPUTS_DIR = Path(__file__).parent.parent / "outputs"
OUTPUTS_DIR.mkdir(exist_ok=True)

# In-memory job store
jobs: dict = {}

# In-memory batch store  { batch_id: { batch_id, job_ids, created_at, profile_url } }
batches: dict = {}

# In-memory scrape job store  { scrape_id: { status, videos, error, created_at } }
scrape_jobs: dict = {}


class URLRequest(BaseModel):
    url: str


class ValidateRequest(BaseModel):
    url: str


class ScrapeProfileRequest(BaseModel):
    url: str
    start: int = 1
    end: int = 10


class BatchProcessRequest(BaseModel):
    urls: list
    profile_url: str = ""


def update_job(job_id: str, **kwargs):
    if job_id in jobs:
        jobs[job_id].update(kwargs)
    # Persist to disk
    job_dir = OUTPUTS_DIR / job_id
    job_dir.mkdir(exist_ok=True)
    with open(job_dir / "status.json", "w", encoding="utf-8") as f:
        json.dump(jobs[job_id], f, ensure_ascii=False, indent=2)


def run_pipeline(job_id: str, url: str):
    """Full processing pipeline: download → transcribe → summarize → extract."""
    try:
        # ── Step 1: Download ──────────────────────────────────────────────────
        update_job(job_id,
                   status="downloading",
                   step=1,
                   step_label="Downloading video audio...",
                   progress=10)

        download_result = download_audio(url, job_id)

        update_job(job_id,
                   step=1,
                   step_label="Download complete",
                   progress=25,
                   title=download_result["title"],
                   thumbnail=download_result["thumbnail"])

        # ── Step 2: Transcribe ────────────────────────────────────────────────
        update_job(job_id,
                   status="transcribing",
                   step=2,
                   step_label="Transcribing audio with Whisper...",
                   progress=30)

        transcription = transcribe_audio(download_result["audio_path"])

        # Save transcript
        job_dir = OUTPUTS_DIR / job_id
        with open(job_dir / "transcript.txt", "w", encoding="utf-8") as f:
            f.write(transcription["text"])

        update_job(job_id,
                   step=2,
                   step_label="Transcription complete",
                   progress=55,
                   transcript=transcription["text"],
                   detected_language=transcription["language"],
                   segments=transcription["segments"])

        # ── Step 3: Summarize ─────────────────────────────────────────────────
        update_job(job_id,
                   status="summarizing",
                   step=3,
                   step_label="Generating AI summary with Ollama...",
                   progress=60)

        summary = summarize_transcript(
            transcription["text"],
            language=transcription["language"],
            video_title=download_result.get("title", "")
        )

        # Save summary
        with open(job_dir / "summary.txt", "w", encoding="utf-8") as f:
            f.write(summary)

        update_job(job_id,
                   step=3,
                   step_label="Summary complete",
                   progress=80,
                   summary=summary)

        # ── Step 4: Extract ───────────────────────────────────────────────────
        update_job(job_id,
                   status="extracting",
                   step=4,
                   step_label="Extracting structured information...",
                   progress=85)

        # Pass the summary alongside the transcript so the LLM has clear
        # English context to identify eatery name and location even when
        # the raw transcript is in Malay or mixed language.
        extracted = extract_info(
            transcription["text"], 
            summary=summary,
            video_title=download_result.get("title", "")
        )

        # ── Fallback: parse eatery/location from summary if still null ────────
        # The summary starts with a sentence like:
        #   "This video features a food spot in Malacca."
        #   "This is a recommendation for Mr. Moyo in Kuala Lumpur."
        # We use simple regex to extract the eatery name and city when the
        # LLM extraction left them as null.
        import re as _re

        if not extracted.get("eatery_name") and summary:
            # Look for eatery name patterns in the summary
            name_patterns = [
                r"(?:eatery|restaurant|cafe|stall|spot|place)\s+(?:is\s+|called\s+|named\s+)?['\"]?([A-Z][^.,\n'\"]{2,40})['\"]?",
                r"(?:features?|reviewing|visited?|at)\s+([A-Z][A-Za-z0-9\s'&\-]{2,35})(?:\s+in\s+|\s+at\s+|\s*[,.])",
            ]
            for pat in name_patterns:
                m = _re.search(pat, summary, _re.IGNORECASE)
                if m:
                    extracted["eatery_name"] = m.group(1).strip()
                    break

        if not extracted.get("location") and summary:
            # Look for city/location in the first two sentences of the summary
            first_sentences = ". ".join(summary.split(".")[:2])
            loc_patterns = [
                r"\bin\s+(Malacca|Melaka|Kuala Lumpur|KL|Penang|Johor Bahru|JB|Selangor|Putrajaya|Cyberjaya|Subang|Shah Alam|Petaling Jaya|PJ|Klang|Ipoh|Kota Kinabalu|Kuching|Alor Setar|Kota Bharu|Kuala Terengganu|Miri|Sibu)\b",
                r"\bin\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b",
            ]
            for pat in loc_patterns:
                m = _re.search(pat, first_sentences, _re.IGNORECASE)
                if m:
                    extracted["location"] = m.group(1).strip()
                    # Update is_in_malacca if we found a location
                    loc_lower = extracted["location"].lower()
                    if "malacca" in loc_lower or "melaka" in loc_lower:
                        extracted["is_in_malacca"] = True
                    break

        # Save extraction
        with open(job_dir / "extraction.json", "w", encoding="utf-8") as f:
            json.dump(extracted, f, ensure_ascii=False, indent=2)

        update_job(job_id,
                   step=4,
                   step_label="Extraction complete",
                   status="completed",
                   progress=100,
                   extracted=extracted,
                   completed_at=datetime.now().isoformat())


    except Exception as e:
        update_job(job_id,
                   status="error",
                   error=str(e),
                   progress=0)


@router.post("/validate-url")
async def api_validate_url(req: ValidateRequest):
    result = validate_url(req.url)
    return result


def _run_scrape_job(scrape_id: str, url: str, start: int, end: int, platform: str):
    """Background worker: run yt-dlp scrape and store results in scrape_jobs."""
    try:
        videos = scrape_profile(url, start=start, end=end)
        scrape_jobs[scrape_id].update({
            "status": "done",
            "videos": videos,
            "count": len(videos),
            "platform": platform,
        })
    except Exception as e:
        scrape_jobs[scrape_id].update({"status": "error", "error": str(e)})


@router.post("/scrape-profile")
async def api_scrape_profile(req: ScrapeProfileRequest, background_tasks: BackgroundTasks):
    """Start a profile scrape in the background. Returns scrape_id immediately."""
    validation = validate_url(req.url)
    if not validation["valid"]:
        raise HTTPException(status_code=400, detail=validation["error"])
    if validation["url_type"] != "profile":
        raise HTTPException(status_code=400, detail="URL is a single video, not a profile. Use /api/process instead.")

    scrape_id = str(uuid.uuid4())
    scrape_jobs[scrape_id] = {
        "scrape_id": scrape_id,
        "status": "scraping",   # scraping | done | error
        "url": req.url,
        "platform": validation["platform"],
        "videos": [],
        "count": 0,
        "error": None,
        "created_at": datetime.now().isoformat(),
    }

    # Fire-and-forget in the dedicated scrape thread pool
    loop = asyncio.get_event_loop()
    loop.run_in_executor(
        _scrape_executor,
        lambda: _run_scrape_job(scrape_id, req.url, req.start, req.end, validation["platform"])
    )

    return {"scrape_id": scrape_id, "status": "scraping"}


@router.get("/scrape-status/{scrape_id}")
async def api_scrape_status(scrape_id: str):
    """Poll for scrape job results."""
    if scrape_id not in scrape_jobs:
        raise HTTPException(status_code=404, detail="Scrape job not found")
    return scrape_jobs[scrape_id]


def run_batch_pipeline(batch_id: str, urls: list):
    """Run the full pipeline for each URL sequentially, updating batch state."""
    for job_id in batches[batch_id]["job_ids"]:
        job = jobs.get(job_id)
        if not job:
            continue
        run_pipeline(job_id, job["url"])


@router.post("/batch-process")
async def api_batch_process(req: BatchProcessRequest, background_tasks: BackgroundTasks):
    """Start a batch job for multiple video URLs."""
    if not req.urls:
        raise HTTPException(status_code=400, detail="No URLs provided")
    if len(req.urls) > 1000:
        raise HTTPException(status_code=400, detail="Maximum 1000 videos per batch")

    batch_id = str(uuid.uuid4())
    job_ids = []

    for url in req.urls:
        validation = validate_url(url)
        if not validation["valid"]:
            continue  # skip invalid URLs
        job_id = str(uuid.uuid4())
        jobs[job_id] = {
            "job_id": job_id,
            "batch_id": batch_id,
            "url": url,
            "platform": validation["platform"],
            "status": "queued",
            "step": 0,
            "step_label": "Queued for processing",
            "progress": 0,
            "title": None,
            "thumbnail": None,
            "transcript": None,
            "detected_language": None,
            "segments": [],
            "summary": None,
            "extracted": None,
            "error": None,
            "created_at": datetime.now().isoformat(),
            "completed_at": None,
        }
        job_ids.append(job_id)

    batches[batch_id] = {
        "batch_id": batch_id,
        "profile_url": req.profile_url,
        "job_ids": job_ids,
        "total": len(job_ids),
        "created_at": datetime.now().isoformat(),
    }

    background_tasks.add_task(run_batch_pipeline, batch_id, req.urls)

    return {"batch_id": batch_id, "job_ids": job_ids, "total": len(job_ids)}


@router.get("/batch-status/{batch_id}")
async def api_batch_status(batch_id: str):
    """Return current status of all jobs in a batch."""
    if batch_id not in batches:
        raise HTTPException(status_code=404, detail="Batch not found")
    batch = batches[batch_id]
    job_statuses = []
    for job_id in batch["job_ids"]:
        if job_id in jobs:
            job_statuses.append(jobs[job_id])
    completed = sum(1 for j in job_statuses if j["status"] == "completed")
    failed    = sum(1 for j in job_statuses if j["status"] == "error")
    return {
        "batch_id": batch_id,
        "profile_url": batch["profile_url"],
        "total": batch["total"],
        "completed": completed,
        "failed": failed,
        "in_progress": batch["total"] - completed - failed,
        "jobs": job_statuses,
    }


@router.post("/process")
async def api_process(req: URLRequest, background_tasks: BackgroundTasks):
    # Validate URL first
    validation = validate_url(req.url)
    if not validation["valid"]:
        raise HTTPException(status_code=400, detail=validation["error"])

    job_id = str(uuid.uuid4())
    jobs[job_id] = {
        "job_id": job_id,
        "url": req.url,
        "platform": validation["platform"],
        "status": "queued",
        "step": 0,
        "step_label": "Queued for processing",
        "progress": 0,
        "title": None,
        "thumbnail": None,
        "transcript": None,
        "detected_language": None,
        "segments": [],
        "summary": None,
        "extracted": None,
        "error": None,
        "created_at": datetime.now().isoformat(),
        "completed_at": None,
    }

    background_tasks.add_task(run_pipeline, job_id, req.url)

    return {"job_id": job_id, "status": "queued"}


@router.get("/status/{job_id}")
async def api_status(job_id: str):
    if job_id not in jobs:
        # Try to load from disk
        job_file = OUTPUTS_DIR / job_id / "status.json"
        if job_file.exists():
            with open(job_file, "r", encoding="utf-8") as f:
                return json.load(f)
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs[job_id]


@router.get("/results/{job_id}")
async def api_results(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    job = jobs[job_id]
    if job["status"] != "completed":
        raise HTTPException(status_code=202, detail="Job not yet completed")
    return job
