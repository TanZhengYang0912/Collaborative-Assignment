import { useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";

// Draws the multi-stop trip route (already-decoded [{lat,lng}] points from OSRM).
export default function TripPolyline({ path }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !path?.length) return;

    const line = new google.maps.Polyline({
      path,
      strokeColor: "#4285F4",
      strokeOpacity: 0.9,
      strokeWeight: 5,
      map,
    });

    // No fitBounds here on purpose — camera focus is owned by FocusOnVendor /
    // FocusOnUser, driven by explicit user actions. Auto-fitting to the whole
    // route on every recalculation used to silently zoom the map back out
    // (e.g. away from a single vendor the user just picked, or away from
    // "nearest 10" mode) the moment a route came back from the trip API.
    return () => line.setMap(null);
  }, [map, path]);

  return null;
}
