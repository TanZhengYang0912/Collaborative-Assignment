import { Star } from "lucide-react";

const TERRACOTTA = "#A35D47";

// value: 1-5 (rounds down for display). onChange present -> interactive input.
// Interactive stars render as real buttons with 44px targets; read-only stars
// stay inline so a rating inside a card keeps its compact footprint.
export default function StarRating({ value = 0, onChange, size = 16 }) {
  const stars = [1, 2, 3, 4, 5];
  const interactive = typeof onChange === "function";

  if (!interactive) {
    return (
      <div className="inline-flex gap-0.5">
        {stars.map((n) => (
          <Star
            key={n}
            size={size}
            color={TERRACOTTA}
            fill={n <= Math.round(value) ? TERRACOTTA : "none"}
            strokeWidth={1.5}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="-mx-1 inline-flex" role="radiogroup" aria-label="Rating">
      {stars.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          role="radio"
          aria-checked={n === Math.round(value)}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          className="grid size-11 place-items-center"
        >
          <Star
            size={size}
            color={TERRACOTTA}
            fill={n <= Math.round(value) ? TERRACOTTA : "none"}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}
