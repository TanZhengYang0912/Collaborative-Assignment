const BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

// Fetch restaurants (nearest first) from Supabase via the backend.
// Normalises lat/lng -> latitude/longitude so the map components can use either.
export async function getRestaurants(userLat, userLng) {
  const params = new URLSearchParams({ lat: userLat, lng: userLng });
  const r = await fetch(`${BASE}/api/restaurants/nearby?${params}`);
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json();
  return data.map((v) => ({ ...v, latitude: v.lat, longitude: v.lng }));
}

// Real road route (Google Directions via backend). Returns { distance, duration, path }.
export async function getRoute(from, to) {
  const params = new URLSearchParams({
    fromLat: from.lat, fromLng: from.lng, toLat: to.lat, toLng: to.lng,
  });
  const r = await fetch(`${BASE}/api/route?${params}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // { distance, duration, path: [{lat,lng}] }
}

// Multi-stop trip (free OSRM via backend). points[0] is the start.
// optimize=true suggests best order; optimize=false follows the given order.
export async function getTrip(points, optimize = true) {
  const r = await fetch(`${BASE}/api/trip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ points, optimize }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // { order, path, distance, duration }
}

// Add a new restaurant — geocoding happens server-side on insert.
export async function addRestaurant(name, address) {
  const r = await fetch(`${BASE}/api/restaurants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, address }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
