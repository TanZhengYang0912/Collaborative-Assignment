import { useEffect, useRef } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { C, FONT_BODY } from "../lib/theme";

// Google Places Autocomplete box for typing a start location manually,
// instead of relying on GPS. Restricted to Malaysia to match app coverage.
export default function LocationInput({ onSelect }) {
  const placesLib = useMapsLibrary("places");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!placesLib || !inputRef.current) return;

    const autocomplete = new placesLib.Autocomplete(inputRef.current, {
      fields: ["geometry", "name"],
      componentRestrictions: { country: "my" },
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const loc = place.geometry?.location;
      if (!loc) return;
      onSelect({ lat: loc.lat(), lng: loc.lng() });
    });

    return () => listener.remove();
  }, [placesLib, onSelect]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Search start address…"
      style={{
        width: "100%",
        boxSizing: "border-box",
        padding: "8px 10px",
        marginBottom: 8,
        borderRadius: 8,
        border: `1px solid ${C.border}`,
        background: C.cream,
        color: C.text,
        fontSize: 13,
        fontFamily: FONT_BODY,
        outline: "none",
      }}
      onFocus={(e) => (e.target.style.borderColor = C.accent)}
      onBlur={(e) => (e.target.style.borderColor = C.border)}
    />
  );
}
