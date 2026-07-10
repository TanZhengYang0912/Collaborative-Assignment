import { Star } from "lucide-react";
import { C } from "../../lib/theme";

// value: 1-5 (rounds down for display). onChange present -> interactive input.
export default function StarRating({ value = 0, onChange, size = 16 }) {
  const stars = [1, 2, 3, 4, 5];
  const interactive = typeof onChange === "function";

  return (
    <div style={{ display: "inline-flex", gap: 2 }}>
      {stars.map((n) => (
        <span
          key={n}
          onClick={interactive ? () => onChange(n) : undefined}
          style={{ cursor: interactive ? "pointer" : "default", display: "flex" }}
        >
          <Star
            size={size}
            color={C.gold}
            fill={n <= Math.round(value) ? C.gold : "none"}
            strokeWidth={1.5}
          />
        </span>
      ))}
    </div>
  );
}
