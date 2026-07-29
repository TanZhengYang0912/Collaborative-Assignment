// Hands the planned trip off to Google Maps for turn-by-turn navigation — we
// don't build in-app navigation ourselves. Adapted from the multi-stop-map
// handoff's buildGoogleMapsDirectionsUrl (see docs/multistop-map-handoff.md).
const MODE_PARAM = { DRIVING: "driving", TWO_WHEELER: "driving", WALKING: "walking", TRANSIT: "transit" };

// Google's consumer "dir" URL supports an origin, a destination and up to 9
// intermediate waypoints — anything beyond that is silently dropped.
const MAX_WAYPOINTS = 9;

export function buildGoogleMapsUrl(stops, travelMode) {
  if (stops.length < 2) return null;

  const [origin, ...rest] = stops;
  const capped = rest.slice(0, MAX_WAYPOINTS);
  const destination = capped[capped.length - 1];
  const waypoints = capped.slice(0, -1);

  const params = new URLSearchParams({
    api: "1",
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    travelmode: MODE_PARAM[travelMode] || "driving",
  });
  if (waypoints.length) params.set("waypoints", waypoints.map((w) => `${w.lat},${w.lng}`).join("|"));

  return { url: `https://www.google.com/maps/dir/?${params.toString()}`, truncated: rest.length > MAX_WAYPOINTS };
}
