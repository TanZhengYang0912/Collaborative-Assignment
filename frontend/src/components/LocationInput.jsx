import { useEffect, useRef } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

// Google Places Autocomplete box for typing a start location manually,
// instead of relying on GPS. Restricted to Malaysia to match app coverage.
export default function LocationInput({ onSelect, placeholder = "Search start address…" }) {
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
      onSelect({ lat: loc.lat(), lng: loc.lng(), label: place.name || inputRef.current.value });
    });

    return () => listener.remove();
  }, [placesLib, onSelect]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      className="mb-2 min-h-11 w-full rounded-lg border border-sand bg-chalk px-2.5 text-[13px] text-ink outline-none focus:border-forest"
    />
  );
}
