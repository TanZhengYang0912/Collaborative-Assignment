import { useState } from "react";

const C = {
  card: "#FFFFFF",
  accent: "#D85A30",
  accentDark: "#993C1D",
  cream: "#FBF4EA",
  text: "#3E2C23",
  muted: "#9A8478",
  border: "#EADBCB",
};

const panel = {
  position: "absolute",
  top: 64,
  right: 16,
  width: 260,
  maxHeight: "70vh",
  overflowY: "auto",
  background: C.card,
  borderRadius: 12,
  boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
  padding: 14,
  fontFamily: "system-ui",
  zIndex: 10,
};

// Multi-stop trip planner. Every entry (including "Your location") is a normal
// draggable stop — nothing is locked as start or end.
export default function TripPanel({
  trip, summary, loading,
  onReorder, onOptimize, onClear, onRemove,
}) {
  const [dragIdx, setDragIdx] = useState(null);

  function handleDrop(i) {
    if (dragIdx === null || dragIdx === i) return;
    const next = [...trip];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(i, 0, moved);
    setDragIdx(null);
    onReorder(next);
  }

  return (
    <div style={panel}>
      <div style={{ fontWeight: 600, color: C.accentDark, marginBottom: 8 }}>🧭 Your trip</div>

      {trip.length === 0 ? (
        <div style={{ fontSize: 13, color: C.muted }}>
          Tap a pin on the map → <strong>➕ Add stop</strong> to build a trip.
        </div>
      ) : (
        <>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Drag any stop to reorder</div>
          <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {trip.map((s, i) => (
              <li
                key={s.id}
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(i)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 6px", marginBottom: 4,
                  background: dragIdx === i ? C.cream : "transparent",
                  border: `1px solid ${C.border}`, borderRadius: 8,
                  cursor: "grab",
                }}
              >
                <span style={{ color: C.muted }} aria-hidden="true">⠿</span>
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: C.accent, color: "#fff", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: 13, color: C.text }}>
                  {s.isMe ? "📍 " : ""}{s.name}
                </span>
                <button
                  onClick={() => onRemove(s.id)}
                  aria-label="Remove stop"
                  style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 16 }}
                >×</button>
              </li>
            ))}
          </ol>

          {loading && <div style={{ fontSize: 12, color: C.muted, margin: "8px 0" }}>Calculating route…</div>}
          {summary && !loading && (
            <div style={{ fontSize: 13, background: C.cream, padding: 8, borderRadius: 8, margin: "8px 0", color: C.text }}>
              🛣 {summary.distance} · ⏱ {summary.duration}
            </div>
          )}

          <button onClick={onOptimize} style={btn(C.accent, "#fff")}>↺ Suggest best order</button>
          <button onClick={onClear} style={btn("#eee", C.text)}>Clear trip</button>
        </>
      )}
    </div>
  );
}

function btn(bg, color) {
  return {
    display: "block", width: "100%", padding: "8px 12px", margin: "4px 0",
    border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13,
    background: bg, color,
  };
}
