import { useEffect } from "react";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";

// Renders "tourist saturation hot spots" as a heatmap. Conceptually this shows
// the over-crowded zones (e.g. Jonker Street) that TrueBites steers users AWAY
// from — a nice visual contrast to your green hidden-gem pins.
export default function Heatmap({ points }) {
  const map = useMap();
  const visualization = useMapsLibrary("visualization");

  useEffect(() => {
    if (!map || !visualization || !points?.length) return;

    const data = points.map((p) => ({
      location: new google.maps.LatLng(p.lat, p.lng),
      weight: p.weight || 1,
    }));

    const layer = new google.maps.visualization.HeatmapLayer({
      data,
      radius: 45,
      opacity: 0.7,
      map,
    });

    return () => layer.setMap(null);
  }, [map, visualization, points]);

  return null;
}
