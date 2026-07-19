import { Coffee, Grid2X2, MoreHorizontal, Soup, Flower2, Users } from "lucide-react";
import { C, FONT_BODY } from "../../lib/theme";
import {
  CATEGORY_FILTERS,
  MORE_CATEGORY_OPTIONS,
  categoryMatches,
  creatorHandle,
} from "../../lib/vendorDisplay";

const ICONS = {
  all: Grid2X2,
  local: Soup,
  cafe: Coffee,
  nyonya: Flower2,
};

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
    <div className="discovery-filterbar" style={{ fontFamily: FONT_BODY }}>
      <div className="discovery-filter-group">
        {CATEGORY_FILTERS.map(({ key, label }) => {
          const Icon = ICONS[key];
          const isActive = active === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={`discovery-filter-button${isActive ? " discovery-filter-button-active" : ""}`}
              aria-pressed={isActive}
            >
              {Icon && <Icon size={14} strokeWidth={1.7} />}
              <span>{label === "Malaysian / Local" ? "Malaysian / Local" : label}</span>
              <small style={{ opacity: isActive ? 0.72 : 0.55 }}>{countFor(vendors, key)}</small>
            </button>
          );
        })}

        {availableMore.length > 0 && (
          <label style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            <MoreHorizontal size={15} color={selectedMore ? "#fff" : C.muted} style={{ position: "absolute", left: 10, pointerEvents: "none" }} />
            <select
              value={selectedMore ? active : ""}
              onChange={(event) => event.target.value && onSelect(event.target.value)}
              className="discovery-filter-select"
              style={{ paddingLeft: 30, background: selectedMore ? C.navy : "#fff", color: selectedMore ? "#fff" : C.text, borderColor: selectedMore ? C.navy : C.border }}
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

      <div className="discovery-filter-divider" />

      <div className="discovery-filter-group">
        <Users size={14} color={C.muted} />
        <span className="discovery-filter-label">Recommended by</span>
        <select
          value={creator}
          onChange={(event) => onCreatorSelect(event.target.value)}
          className="discovery-filter-select"
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
