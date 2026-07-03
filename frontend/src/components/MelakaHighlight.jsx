import { useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import boundary from "../melaka-boundary.json";

// Highlights Melaka by outlining the state border and giving it a faint tint.
// The normal map still shows everywhere (no masking) — clean and reliable.
// Also frames the view on Melaka and stops you zooming out too far.
export default function MelakaHighlight() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Both rings (mainland + small exclave) drawn as a light-filled, outlined area.
    const region = new google.maps.Polygon({
      paths: boundary.rings,
      strokeColor: "#2a9d8f",
      strokeWeight: 3,
      strokeOpacity: 0.95,
      fillColor: "#2a9d8f",
      fillOpacity: 0.08,
      clickable: false,
      map,
    });

    // Frame the INITIAL view on Melaka, but allow free panning/zoom anywhere
    // (users may travel in from other states).
    const bounds = new google.maps.LatLngBounds();
    boundary.rings.forEach((r) => r.forEach((p) => bounds.extend(p)));
    map.fitBounds(bounds);

    return () => {
      region.setMap(null);
    };
  }, [map]);

  return null;
}
