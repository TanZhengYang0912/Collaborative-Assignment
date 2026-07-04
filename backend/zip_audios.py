import os
import json
import shutil
import re
from pathlib import Path

OUTPUTS_DIR = Path("/Users/chunjietan/aiContent/backend/outputs")
EXPORT_DIR = Path("/Users/chunjietan/aiContent/Recovered_Audios")
EXPORT_DIR.mkdir(exist_ok=True)

count = 0
for job_dir in OUTPUTS_DIR.iterdir():
    if not job_dir.is_dir():
        continue
    
    status_file = job_dir / "status.json"
    if not status_file.exists():
        continue
        
    try:
        with open(status_file, "r", encoding="utf-8") as f:
            job = json.load(f)
    except:
        continue

    # Find audio file
    audio_file = None
    for file in job_dir.iterdir():
        if file.name.startswith("audio."):
            audio_file = file
            break
            
    if not audio_file:
        continue

    # Clean title
    title = job.get("title") or job.get("job_id")
    # remove invalid chars for filename
    clean_title = re.sub(r'[\\/*?:"<>|]', "", title).strip()[:100]
    
    # Use eatery name if available
    ext = job.get("extracted") or {}
    vendor = ext.get("vendor_name") or ext.get("eatery_name") or ""
    if vendor:
        clean_vendor = re.sub(r'[\\/*?:"<>|]', "", vendor).strip()
        final_name = f"{clean_vendor} - {clean_title}{audio_file.suffix}"
    else:
        final_name = f"{clean_title}{audio_file.suffix}"

    dest_file = EXPORT_DIR / final_name
    
    # Copy file if it doesn't exist
    if not dest_file.exists():
        shutil.copy2(audio_file, dest_file)
        count += 1

print(f"Copied {count} audio files to {EXPORT_DIR}")
