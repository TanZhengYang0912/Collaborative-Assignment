import { useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";

// Google's built-in overlay for real bus/rail lines (LRT, MRT, KTM, buses).
// Coverage depends entirely on what Google has mapped for the area — dense in
// KL/Klang Valley, sparse to none in smaller towns like Melaka.
export default function TransitLayer() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const layer = new google.maps.TransitLayer();
    layer.setMap(map);
    return () => layer.setMap(null);
  }, [map]);

  return null;
}
