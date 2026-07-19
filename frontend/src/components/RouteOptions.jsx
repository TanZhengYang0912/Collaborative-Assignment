import { C, FONT_BODY } from "../lib/theme";

// Lets the user switch between Google's alternative driving routes, each
// flagged with whether it uses tolls (approximate — see DirectionsRenderer).
export default function RouteOptions({ routes, selectedIndex, onSelect }) {
  if (!routes || routes.length === 0) return null;

  return (
    <div style={{ margin: "8px 0", fontFamily: FONT_BODY }}>
      {routes.map((r) => {
        const active = r.index === selectedIndex;
        return (
          <button
            key={r.index}
            onClick={() => onSelect(r.index)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              width: "100%", boxSizing: "border-box",
              padding: "7px 10px", marginBottom: 4,
              borderRadius: 8, cursor: "pointer", fontSize: 12.5,
              background: active ? C.accent : C.cream,
              color: active ? "#fff" : C.text,
              border: `1.5px solid ${active ? C.accent : C.border}`,
              fontFamily: FONT_BODY,
            }}
          >
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              Route {r.index + 1} · {r.duration} · {r.distance}
            </span>
            {r.hasTolls && (
              <span style={{ color: active ? "#fff" : C.toll, fontSize: 11, fontWeight: 600 }}>
                tolls
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
