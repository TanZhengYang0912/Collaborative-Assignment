// Shared Google Geocoding helper. Mirrors the request pattern already used by
// routes/map.js's POST /restaurants and scripts/geocode.js, pulled into one
// place so the admin "Verify Address" endpoint doesn't duplicate it again.

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Google's geocoder is lenient: an address it can't specifically place often
// still returns 200 with a broad fallback (the whole city/state) rather than
// ZERO_RESULTS — e.g. garbage input silently resolving to "Malacca, Malaysia".
// A result whose `types` are ALL from this "broad" set carries no street/place
// precision, so it's rejected rather than accepted as a real match.
const BROAD_TYPES = new Set([
  "locality", "political", "postal_code",
  "administrative_area_level_1", "administrative_area_level_2",
  "administrative_area_level_3", "administrative_area_level_4",
  "administrative_area_level_5", "country",
]);

function isSpecificEnough(types) {
  return (types || []).some((t) => !BROAD_TYPES.has(t));
}

// Resolves a free-text address to coordinates via Google's Geocoding API.
// Returns null (not a thrown error) when nothing matched — callers turn that
// into a 404, since "no results" is an expected outcome, not a server fault.
// `requireMelaka` rejects results outside Melaka/Malacca, since every vendor
// in this app is expected to be there — catches a geocode landing in the
// wrong state/country from a vague or misspelled address.
export async function geocodeAddress(query, { requireMelaka = true } = {}) {
  if (!GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY is not configured");

  const url =
    `https://maps.googleapis.com/maps/api/geocode/json` +
    `?address=${encodeURIComponent(query)}&region=MY&key=${GOOGLE_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== "OK" || !data.results?.length) return null;

  const result = data.results[0];
  const loc = result.geometry.location;

  if (!isSpecificEnough(result.types)) return null;

  if (requireMelaka) {
    const text = result.formatted_address.toLowerCase();
    if (!text.includes("melaka") && !text.includes("malacca")) return null;
  }

  return { formatted_address: result.formatted_address, latitude: loc.lat, longitude: loc.lng };
}
