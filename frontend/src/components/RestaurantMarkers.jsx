import { Marker } from "@react-google-maps/api";

// Custom bowl-shaped SVG icon — clearly different from Google's teardrop pin.
// The path draws a rounded bowl with two chopsticks sticking out.
// Coordinates are in the SVG path unit space (centered at 0,0).
const BOWL_PATH =
  // Bowl body: a wide U shape
  "M -14,0 Q -14,12 0,14 Q 14,12 14,0 Z " +
  // Rim of the bowl
  "M -16,-1 Q 0,-4 16,-1 Q 0,2 -16,-1 Z " +
  // Left chopstick
  "M -5,-18 L -3,0 L -5,0 Z " +
  // Right chopstick
  "M 5,-18 L 3,0 L 5,0 Z";

// Orange bowl for a normal pin
const ICON_NORMAL = {
  path: BOWL_PATH,
  fillColor: "#E76F51",
  fillOpacity: 1,
  strokeColor: "#fff",
  strokeWeight: 1.5,
  scale: 1.3,
  anchor: { x: 0, y: 8 },        // anchor at bottom-center of bowl
  labelOrigin: { x: 0, y: -22 }, // label floats above the chopsticks
};

// Teal bowl when this restaurant is selected
const ICON_SELECTED = {
  ...ICON_NORMAL,
  fillColor: "#2A9D8F",
  strokeColor: "#fff",
};

export default function RestaurantMarkers({ restaurants, selectedId, onSelect }) {
  return restaurants.map((r) => (
    <Marker
      key={r.id}
      position={{ lat: r.lat, lng: r.lng }}
      icon={selectedId === r.id ? ICON_SELECTED : ICON_NORMAL}
      label={{
        text: r.name,
        fontSize: "12px",
        fontWeight: "700",
        color: selectedId === r.id ? "#2A9D8F" : "#E76F51",
      }}
      title={r.name}
      onClick={() => onSelect(r)}
      zIndex={selectedId === r.id ? 50 : 10}
    />
  ));
}
