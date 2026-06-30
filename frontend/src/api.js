const BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

// MODULE 2: Fetch restaurants sorted by Haversine distance from user GPS.
// userLat/userLng come from navigator.geolocation — never hardcoded.
export async function getRestaurants(userLat, userLng) {
  const params = new URLSearchParams({ lat: userLat, lng: userLng });
  const r = await fetch(`${BASE}/api/restaurants/nearby?${params}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// MODULE 3: Fetch real road distance, ETA, and decoded route path from
// Google Directions API (via backend). Called only when user selects a restaurant.
export async function getRoute(from, to) {
  const params = new URLSearchParams({
    fromLat: from.lat,
    fromLng: from.lng,
    toLat: to.lat,
    toLng: to.lng,
  });
  const r = await fetch(`${BASE}/api/route?${params}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // { distance, duration, path: [{lat, lng}, ...] }
}

// MODULE 1: Add a new restaurant — geocoding happens server-side on insert.
export async function addRestaurant(name, address) {
  const r = await fetch(`${BASE}/api/restaurants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, address }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
