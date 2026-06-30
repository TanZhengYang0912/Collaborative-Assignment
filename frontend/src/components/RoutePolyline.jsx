import { Polyline } from "@react-google-maps/api";

// Two-layer polyline: white outline underneath + bright blue on top.
// Matches Google Maps navigation style and stays visible on both day and night maps.
export default function RoutePolyline({ path }) {
  if (!path || !path.length) return null;
  return (
    <>
      {/* White outline layer — makes the route stand out on dark backgrounds */}
      <Polyline
        path={path}
        options={{
          strokeColor: "#ffffff",
          strokeOpacity: 0.9,
          strokeWeight: 10,
          zIndex: 1,
        }}
      />
      {/* Bright blue route on top — visible on both day and night maps */}
      <Polyline
        path={path}
        options={{
          strokeColor: "#4285F4",
          strokeOpacity: 1,
          strokeWeight: 6,
          zIndex: 2,
        }}
      />
    </>
  );
}
