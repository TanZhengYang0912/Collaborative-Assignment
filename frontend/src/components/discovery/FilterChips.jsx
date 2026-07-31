import { Coffee, Grid2X2, MoreHorizontal, Soup, Flower2, Users } from "lucide-react";
import {
  CATEGORY_FILTERS,
  MORE_CATEGORY_OPTIONS,
  categoryMatches,
  creatorHandle,
} from "../../lib/vendorDisplay";

const MUTED = "#69717A";

const ICONS = {
  all: Grid2X2,
  local: Soup,
  cafe: Coffee,
  nyonya: Flower2,
};

const CHIP = "inline-flex min-h-11 items-center gap-1.5 rounded-md border px-3 text-[13px] font-semibold transition-colors active:scale-97 motion-reduce:transition-none";
const CHIP_IDLE = `${CHIP} border-sand bg-white text-muted hover:border-forest hover:text-forest`;
const CHIP_ACTIVE = `${CHIP} border-forest bg-forest text-white`;
const SELECT = "min-h-11 rounded-md border border-sand bg-white px-3 text-[13px] text-ink outline-none focus:border-forest";

function countFor(vendors, key) {
  return vendors.filter((vendor) => categoryMatches(vendor, key)).length;
}

export default function FilterChips({ active, onSelect, creator, onCreatorSelect, vendors = [] }) {
  const availableMore = MORE_CATEGORY_OPTIONS.filter((option) => countFor(vendors, option.key) > 0);
  const creatorCounts = new Map();
  vendors.forEach((vendor) => {
    const handle = creatorHandle(vendor);
    if (handle) creatorCounts.set(handle, (creatorCounts.get(handle) || 0) + 1);
  });
  const creators = [...creatorCounts.entries()].sort((a, b) => b[1] - a[1]);
  const selectedMore = availableMore.some((option) => option.key === active);

  return (
    <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORY_FILTERS.map(({ key, label }) => {
          const Icon = ICONS[key];
          const isActive = active === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={isActive ? CHIP_ACTIVE : CHIP_IDLE}
              aria-pressed={isActive}
            >
              {Icon && <Icon size={14} strokeWidth={1.7} />}
              <span>{label}</span>
              <small className={isActive ? "opacity-70" : "opacity-55"}>{countFor(vendors, key)}</small>
            </button>
          );
        })}

        {availableMore.length > 0 && (
          <label className="relative inline-flex items-center">
            <MoreHorizontal
              size={15}
              color={selectedMore ? "#fff" : MUTED}
              className="pointer-events-none absolute left-2.5"
            />
            <select
              value={selectedMore ? active : ""}
              onChange={(event) => event.target.value && onSelect(event.target.value)}
              className={selectedMore
                ? "min-h-11 rounded-md border border-forest bg-forest pl-8 pr-3 text-[13px] text-white outline-none"
                : `${SELECT} pl-8`}
              aria-label="More categories"
            >
              <option value="">More</option>
              {availableMore.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label} ({countFor(vendors, option.key)})
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* Divider becomes a full-width rule once the bar stacks */}
      <div className="h-px w-full bg-sand md:h-6 md:w-px" />

      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Users size={14} color={MUTED} />
        <span className="text-[13px] text-muted">Recommended by</span>
        <select
          value={creator}
          onChange={(event) => onCreatorSelect(event.target.value)}
          className={`min-w-0 max-w-full ${SELECT}`}
          aria-label="Recommended by influencer"
        >
          <option value="all">All creators</option>
          {creators.map(([handle, count]) => (
            <option key={handle} value={handle}>{handle} ({count})</option>
          ))}
        </select>
      </div>
    </div>
  );
}
