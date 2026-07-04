import os
import json
import csv
from pathlib import Path
from datetime import datetime

OUTPUTS_DIR = Path("/Users/chunjietan/aiContent/backend/outputs")
CSV_FILE = Path("/Users/chunjietan/aiContent/recovered_videos.csv")

headers = [
    'vendor_name', 'address', 'city', 'state', 'country',
    'latitude', 'longitude', 'cuisine_types', 'signature_dishes',
    'price_range', 'sentiment_score', 'average_rating', 'review_count',
    'ai_review_summary', 'operating_hours_raw', 'source_video_url',
    'source_platform', 'last_updated'
]

count = 0
with open(CSV_FILE, "w", newline="", encoding="utf-8-sig") as f:
    writer = csv.writer(f)
    writer.writerow(headers)

    for job_dir in OUTPUTS_DIR.iterdir():
        if not job_dir.is_dir():
            continue
        
        status_file = job_dir / "status.json"
        if not status_file.exists():
            continue
            
        with open(status_file, "r", encoding="utf-8") as sf:
            try:
                job = json.load(sf)
            except:
                continue
                
        if job.get("status") != "completed":
            continue
            
        ext = job.get("extracted") or {}
        
        dishes = ", ".join(ext.get("signature_dishes", [])) if isinstance(ext.get("signature_dishes"), list) else ""
        cuisines = ", ".join(ext.get("cuisine_types", [])) if isinstance(ext.get("cuisine_types"), list) else ""
        platform = "TikTok" if "tiktok" in (job.get("url") or "").lower() else "YouTube"
        last_updated = datetime.now().isoformat()
        
        row = [
            ext.get("vendor_name", ""),
            ext.get("address", ""),
            ext.get("city", ""),
            ext.get("state", ""),
            ext.get("country", "Malaysia"),
            "", # latitude
            "", # longitude
            cuisines,
            dishes,
            ext.get("price_range", ""),
            ext.get("sentiment_score", ""),
            "", # average_rating
            "", # review_count
            job.get("summary", ""),
            ext.get("operating_hours_raw", ""),
            job.get("url", ""),
            platform,
            last_updated
        ]
        
        writer.writerow(row)
        count += 1

print(f"Recovered {count} completed videos into {CSV_FILE}")
