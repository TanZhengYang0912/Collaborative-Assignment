// Trip persistence — unauthenticated, browser-local planning state (mirrors
// the multi-stop-map handoff's TripProvider). Only { id, name, lat, lng, isMe,
// source } is stored — never the embedded `vendor` object, since that's a
// point-in-time snapshot that would go stale; MapPage re-hydrates it by id
// once the vendor list has loaded.
const STORAGE_KEY = "truebites:trip";

function isValidStop(s) {
  return s && typeof s.id === "string" && typeof s.lat === "number" && typeof s.lng === "number";
}

export function loadTrip() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.stops) || !parsed.stops.every(isValidStop)) return null;
    return { stops: parsed.stops, travelMode: parsed.travelMode ?? null };
  } catch {
    return null; // corrupt/unavailable storage — start fresh
  }
}

export function saveTrip(stops, travelMode) {
  try {
    const stripped = stops.map(({ id, name, lat, lng, isMe, source }) => ({ id, name, lat, lng, isMe, source }));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ stops: stripped, travelMode }));
  } catch {
    // storage full/unavailable — trip just won't persist this change
  }
}
