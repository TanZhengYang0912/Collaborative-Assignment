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

    // No fitBounds here — every way of entering map view already sets its own
    // deliberate camera target (FocusOnVendor for a single pick, FocusOnUser
    // for the "nearest 10" Map tab). Since the whole map tree remounts every
    // time you come back from Dashboard, this used to re-fire on every visit
    // and stomp on whichever of those had just focused the camera.
    return () => {
      region.setMap(null);
    };
  }, [map]);

  return null;
}
