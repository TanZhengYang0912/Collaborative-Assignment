import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";

export default function DirectionsRenderer({ stops, travelMode, onSummary }) {
  const map = useMap();
  const rendererRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    if (!rendererRef.current) {
      // preserveViewport: true — don't let the renderer auto zoom-to-fit the
      // whole route (that's what showed all of KL→Melaka on screen). Once
      // navigation starts we instead keep the camera locked on the user's
      // current position, the same way turn-by-turn nav apps behave.
      rendererRef.current = new google.maps.DirectionsRenderer({ suppressMarkers: true, preserveViewport: true });
    }

    if (!stops || stops.length < 2 || !travelMode) {
      rendererRef.current.setMap(null);
      return;
    }

    rendererRef.current.setMap(map);

    new google.maps.DirectionsService().route(
      {
        origin:      { lat: stops[0].lat, lng: stops[0].lng },
        destination: { lat: stops[stops.length - 1].lat, lng: stops[stops.length - 1].lng },
        waypoints:   stops.slice(1, -1).map((s) => ({ location: { lat: s.lat, lng: s.lng }, stopover: true })),
        travelMode:  google.maps.TravelMode[travelMode],
      },
      (result, status) => {
        if (status !== "OK") {
          onSummary?.({ error: true, distance: "—", duration: "No route available" });
          return;
        }
        rendererRef.current?.setDirections(result);
        // Focus on the user's current position (always stops[0]) instead of
        // leaving the camera wherever it was — matches how Google Maps
        // centers on you once you start navigating.
        map.panTo({ lat: stops[0].lat, lng: stops[0].lng });
        map.setZoom(17);
        const legs  = result.routes[0].legs;
        const dist  = legs.reduce((a, l) => a + l.distance.value, 0);
        const dur   = legs.reduce((a, l) => a + l.duration.value, 0);
        onSummary?.({
          distance: dist >= 1000 ? `${(dist / 1000).toFixed(1)} km` : `${dist} m`,
          duration: dur  >= 3600
            ? `${Math.floor(dur / 3600)}h ${Math.floor((dur % 3600) / 60)}min`
            : `${Math.floor(dur / 60)} min`,
        });
      }
    );

    return () => rendererRef.current?.setMap(null);
  }, [map, stops, travelMode]);

  return null;
}
