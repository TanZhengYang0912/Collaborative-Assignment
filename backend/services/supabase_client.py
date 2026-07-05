import os
import httpx
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")


def geocode_address(vendor_name: str, address: str = "", city: str = "", state: str = ""):
    """
    Geocode via Google Geocoding API. Prefers the full street address; falls back
    to city/state when the AI pipeline couldn't extract a precise address (common
    for roadside stalls that never get a formal address mentioned on video).
    Returns None if Google can't resolve the query at all.
    """
    location_text = address.strip() if address else ", ".join(p for p in [city, state] if p)
    if not location_text:
        return None

    query = f"{vendor_name}, {location_text}, Malaysia"
    resp = httpx.get(
        "https://maps.googleapis.com/maps/api/geocode/json",
        params={"address": query, "region": "MY", "key": GOOGLE_API_KEY},
        timeout=10,
    )
    data = resp.json()
    if data.get("status") != "OK" or not data.get("results"):
        return None

    result = data["results"][0]
    loc = result["geometry"]["location"]
    return {
        "formatted_address": result["formatted_address"],
        "latitude": loc["lat"],
        "longitude": loc["lng"],
        # Only trust "exact" when the AI actually had a street address to geocode from —
        # city/state-only queries resolve to a city-centroid, not the real vendor location.
        "precision": "exact" if address and address.strip() else "city_level",
    }


def upsert_vendor(row: dict):
    """
    Insert or update a vendor row WITHOUT a DB-level unique constraint on
    source_video_url — that field is not actually unique in this dataset. A
    single "Top 5 Nasi Ayam in Melaka"-style roundup video legitimately lists
    several distinct vendors under the same URL, confirmed by 21 such groups
    already in the CSV-imported data. vendor_name is what carries the real
    uniqueness constraint here, so identity is resolved off that instead:

      - no existing row with this vendor_name      -> INSERT
      - existing row, same source_video_url         -> UPDATE (re-run of same job)
      - existing row, different source_video_url    -> CONFLICT, refuse to touch it
        (this is the "AI guess silently overwrites a verified CSV vendor" risk
        we specifically decided against — surface it instead of clobbering data)
    """
    headers_base = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    }

    existing = httpx.get(
        f"{SUPABASE_URL}/rest/v1/vendors",
        params={"select": "id,source_video_url", "vendor_name": f"eq.{row['vendor_name']}"},
        headers=headers_base,
        timeout=10,
    )
    existing.raise_for_status()
    matches = existing.json()

    if not matches:
        resp = httpx.post(
            f"{SUPABASE_URL}/rest/v1/vendors",
            headers={**headers_base, "Content-Type": "application/json", "Prefer": "return=representation"},
            json=row,
            timeout=10,
        )
        resp.raise_for_status()
        return resp.json()

    match = matches[0]
    if match.get("source_video_url") != row.get("source_video_url"):
        raise ValueError(
            f"vendor_name '{row['vendor_name']}' already exists from a different "
            f"source ({match.get('source_video_url') or 'CSV import'}); refusing to overwrite"
        )

    resp = httpx.patch(
        f"{SUPABASE_URL}/rest/v1/vendors",
        params={"id": f"eq.{match['id']}"},
        headers={**headers_base, "Content-Type": "application/json", "Prefer": "return=representation"},
        json=row,
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()
