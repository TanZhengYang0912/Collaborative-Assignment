import { useState } from "react";

const btn = {
  display: "block",
  width: "100%",
  padding: "10px 12px",
  margin: "6px 0",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
};

export default function RoutePanel({
  selected,
  route,
  userPos,
  loading,
  isDark,
  onToggleDark,
  onLocate,
  onNavigate,
  onClear,
}) {
  const [collapsed, setCollapsed] = useState(false);

  const bg = isDark ? "#1e1e1e" : "#fff";
  const fg = isDark ? "#e0e0e0" : "#111";
  const subtle = isDark ? "#aaa" : "#666";

  // Small tab shown when panel is hidden — lets user reopen it
  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        style={{
          position: "absolute",
          top: 80,
          left: 16,
          background: bg,
          color: fg,
          border: "none",
          borderRadius: 10,
          boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
          padding: "10px 14px",
          cursor: "pointer",
          fontSize: 18,
          zIndex: 10,
        }}
        title="Show panel"
      >
        ☰
      </button>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        width: 290,
        background: bg,
        color: fg,
        borderRadius: 12,
        boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
        padding: 16,
        fontFamily: "system-ui, sans-serif",
        zIndex: 10,
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h3 style={{ margin: 0, fontSize: 17 }}>TrueBites</h3>
        <div style={{ display: "flex", gap: 4 }}>
          {/* Day/Night toggle */}
          <button
            onClick={onToggleDark}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: "0 4px" }}
            title={isDark ? "Switch to day mode" : "Switch to night mode"}
          >
            {isDark ? "☀️" : "🌙"}
          </button>
          {/* Hide panel */}
          <button
            onClick={() => setCollapsed(true)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: "0 4px", color: subtle }}
            title="Hide panel"
          >
            ✕
          </button>
        </div>
      </div>

      <p style={{ margin: "0 0 12px", fontSize: 12, color: subtle }}>
        Restaurant navigation
      </p>

      {/* Locate button */}
      <button style={{ ...btn, background: "#1d72e8", color: "#fff" }} onClick={onLocate}>
        📍 {userPos ? "Update my location" : "Find me"}
      </button>

      {!userPos && (
        <p style={{ fontSize: 13, color: subtle, margin: "4px 0" }}>
          Allow location access to see nearby restaurants.
        </p>
      )}

      {/* Selected restaurant */}
      {selected && (
        <div style={{
          margin: "10px 0",
          padding: 10,
          background: isDark ? "#2a2a2a" : "#f8f8f8",
          borderRadius: 8,
          fontSize: 14,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>{selected.name}</div>
          <div style={{ fontSize: 12, color: isDark ? "#bbb" : "#555", marginBottom: 6 }}>
            {selected.address}
          </div>

          {!route && !loading && (
            <button
              style={{ ...btn, background: "#1d72e8", color: "#fff", margin: "6px 0 0" }}
              onClick={onNavigate}
            >
              🧭 Start Navigation
            </button>
          )}

          {loading && (
            <div style={{ fontSize: 12, color: "#1d72e8" }}>Fetching route…</div>
          )}

          {route && !loading && (
            <div style={{ background: isDark ? "#333" : "#e8f4fd", borderRadius: 6, padding: "8px 10px" }}>
              <div style={{ fontSize: 12, color: subtle, marginBottom: 4 }}>Via Google Directions</div>
              <div>🛣 <strong>{route.distance}</strong></div>
              <div>⏱ <strong>{route.duration}</strong></div>
            </div>
          )}
        </div>
      )}

      {!selected && userPos && (
        <p style={{ fontSize: 13, color: subtle, margin: "8px 0" }}>
          Tap a pin to get precise directions.
        </p>
      )}

      {(route || selected) && (
        <button
          style={{ ...btn, background: isDark ? "#333" : "#eee", color: isDark ? "#ccc" : "#333" }}
          onClick={onClear}
        >
          Clear route
        </button>
      )}
    </div>
  );
}
