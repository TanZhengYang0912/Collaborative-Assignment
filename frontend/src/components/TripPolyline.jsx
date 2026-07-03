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

    const bounds = new google.maps.LatLngBounds();
    path.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, 90);

    return () => line.setMap(null);
  }, [map, path]);

  return null;
}
