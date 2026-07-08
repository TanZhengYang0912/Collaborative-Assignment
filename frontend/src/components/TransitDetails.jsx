const C = {
  text: "#3E2C23",
  muted: "#9A8478",
  border: "#EADBCB",
  cream: "#FBF4EA",
};

const VEHICLE_ICON = {
  BUS: "🚌",
  RAIL: "🚆",
  SUBWAY: "🚇",
  TRAM: "🚊",
  HEAVY_RAIL: "🚆",
  COMMUTER_TRAIN: "🚆",
};

// Vertical itinerary ribbon: one node per leg, transit nodes painted in that
// line's real Google color so KJ Line red / MRT green etc. show through —
// the one piece of "real world" color let into the app's warm palette.
export default function TransitDetails({ legs }) {
  if (!legs || legs.length === 0) {
    return (
      <div style={{ fontSize: 12, color: C.muted, background: C.cream, borderRadius: 8, padding: 10, margin: "8px 0" }}>
        No transit routes here — try Car or Walk.
      </div>
    );
  }

  return (
    <div style={{ margin: "8px 0", fontFamily: "system-ui" }}>
      {legs.map((leg, i) => (
        <div key={i} style={{ display: "flex", gap: 8, position: "relative" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 14 }}>
            <span
              style={{
                width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                background: leg.kind === "transit" ? leg.lineColor : C.muted,
                border: "2px solid #fff", boxShadow: "0 0 0 1px " + C.border,
              }}
            />
            {i < legs.length - 1 && (
              <span style={{ flex: 1, width: 2, background: C.border, minHeight: 18 }} />
            )}
          </div>
          <div style={{ paddingBottom: 12, fontSize: 12.5, color: C.text }}>
            {leg.kind === "transit" ? (
              <>
                <div style={{ fontWeight: 600 }}>
                  {VEHICLE_ICON[leg.vehicle] || "🚏"} {leg.lineName}
                  {leg.departureTime && leg.arrivalTime && (
                    <span style={{ fontWeight: 400, color: C.muted, fontVariantNumeric: "tabular-nums" }}>
                      {" "}· {leg.departureTime}→{leg.arrivalTime}
                    </span>
                  )}
                </div>
                {leg.numStops != null && (
                  <div style={{ color: C.muted, fontSize: 11.5 }}>{leg.numStops} stops</div>
                )}
              </>
            ) : (
              <div style={{ color: C.muted }}>
                🚶 {leg.instructions || "Walk"}{leg.duration ? ` · ${leg.duration}` : ""}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
