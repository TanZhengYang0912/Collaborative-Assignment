import os
import re
from difflib import SequenceMatcher
import httpx
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")


def _normalize_match_text(value: str = ""):
    return re.sub(r"[^a-z0-9]+", " ", str(value or "").lower()).strip()


def _location_match_score(left: str, right: str):
    left_tokens = set(_normalize_match_text(left).split())
    right_tokens = set(_normalize_match_text(right).split())
    if not left_tokens or not right_tokens:
        return 0.0
    return len(left_tokens & right_tokens) / max(len(left_tokens), len(right_tokens))


def find_duplicate_vendors(vendor_name: str, address: str = "", city: str = "", state: str = ""):
    """Return likely existing vendors for the administrator's duplicate review step."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY or not vendor_name:
        return []

    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    }
    safe_name = re.sub(r"[^a-zA-Z0-9 ]+", " ", vendor_name).strip()
    params = {
        "select": "id,vendor_name,address,city,state,status,source_video_url",
        "limit": "1000",
    }
    if safe_name:
        params["vendor_name"] = f"ilike.*{safe_name}*"

    response = httpx.get(
        f"{SUPABASE_URL}/rest/v1/vendors",
        params=params,
        headers=headers,
        timeout=10,
    )
    response.raise_for_status()
    candidates = response.json()

    normalized_name = _normalize_match_text(vendor_name)
    location = " ".join(part for part in [address, city, state] if part)
    results = []
    for candidate in candidates:
        candidate_name = _normalize_match_text(candidate.get("vendor_name"))
        name_score = SequenceMatcher(None, normalized_name, candidate_name).ratio()
        location_score = _location_match_score(location, " ".join(
            part for part in [candidate.get("address"), candidate.get("city"), candidate.get("state")] if part
        ))
        combined_score = name_score if not location else (name_score * 0.7) + (location_score * 0.3)

        if name_score < 0.55 or combined_score < 0.55:
            continue

        results.append({
            **candidate,
            "match_score": round(combined_score, 3),
            "match_type": "exact" if combined_score >= 0.9 else "possible",
        })

    return sorted(results, key=lambda item: item["match_score"], reverse=True)[:10]


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
