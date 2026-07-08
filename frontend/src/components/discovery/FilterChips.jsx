import { Compass, Utensils, Coffee, Landmark, Leaf } from "lucide-react";
import { C, FONT_BODY } from "../../lib/theme";

const CHIPS = [
  { key: "all",        label: "All",         Icon: Compass  },
  { key: "streetfood", label: "Street Food", Icon: Utensils },
  { key: "kopitiam",   label: "Kopitiam",    Icon: Coffee   },
  { key: "heritage",   label: "Heritage",    Icon: Landmark },
  { key: "nyonya",     label: "Nyonya",      Icon: Leaf     },
];

export default function FilterChips({ active, onSelect }) {
  return (
    <div style={{
      display: "flex", gap: 8, padding: "10px 24px",
      background: C.card, borderBottom: `1px solid ${C.border}`,
      overflowX: "auto",
    }}>
      {CHIPS.map(({ key, label, Icon }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 20,
              border: `1.5px solid ${isActive ? C.navy : C.border}`,
              background: isActive ? C.navy : "transparent",
              color: isActive ? "#fff" : C.text,
              fontSize: 13.5, fontWeight: 500, fontFamily: FONT_BODY,
              cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
              transition: "all 0.15s ease",
            }}
          >
            <Icon size={14} /> {label}
          </button>
        );
      })}
    </div>
  );
}
