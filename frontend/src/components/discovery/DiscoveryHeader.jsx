import { Search, LayoutGrid, Map as MapIcon, User } from "lucide-react";
import { C, FONT_DISPLAY, FONT_BODY } from "../../lib/theme";

// Top bar: TRUEBITES/MELAKA·MALAYSIA stacked lockup, centred search, List/Map
// toggle (active = navy), user avatar.
export default function DiscoveryHeader({
  search, onSearchChange,
  onOpenMap,
  session, userEmail, initials, onLogin, onLogout,
}) {
  return (
    <header
      style={{
        display: "flex", alignItems: "center", gap: 20,
        padding: "12px 24px", background: C.card,
        borderBottom: `1px solid ${C.border}`, fontFamily: FONT_BODY,
      }}
    >
      {/* Stacked wordmark: TRUEBITES / MELAKA · MALAYSIA */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8, background: C.navy,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ color: C.gold, fontSize: 15, fontWeight: 700, fontFamily: FONT_DISPLAY }}>TB</span>
        </div>
        <div style={{ lineHeight: 1.15 }}>
          <div style={{
            fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 17,
            color: C.navy, letterSpacing: 0.5,
          }}>
            TRUEBITES
          </div>
          <div style={{
            fontFamily: FONT_BODY, fontWeight: 500, fontSize: 10,
            color: C.gold, letterSpacing: 1.5, textTransform: "uppercase",
          }}>
            MELAKA · MALAYSIA
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative", width: "100%", maxWidth: 440 }}>
          <Search
            size={16} color={C.muted}
            style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Nasi Lemak, Jonker, Kopitiam…"
            style={{
              width: "100%", boxSizing: "border-box", padding: "9px 14px 9px 38px",
              borderRadius: 10, border: `1px solid ${C.border}`, background: C.cream,
              color: C.text, fontSize: 14, fontFamily: FONT_BODY, outline: "none",
            }}
          />
        </div>
      </div>

      {/* LIST/MAP toggle + avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div style={{
          display: "flex", background: C.cream, borderRadius: 10,
          padding: 3, border: `1px solid ${C.border}`,
        }}>
          <span style={{
            display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
            borderRadius: 8, background: C.navy, color: "#fff",
            fontSize: 13, fontWeight: 500,
          }}>
            <LayoutGrid size={14} /> List
          </span>
          <button
            onClick={onOpenMap}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
              borderRadius: 8, background: "none", border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 500, color: C.muted, fontFamily: FONT_BODY,
            }}
          >
            <MapIcon size={14} /> Map
          </button>
        </div>

        {session ? (
          <div
            title={userEmail}
            style={{
              width: 34, height: 34, borderRadius: "50%", background: C.navy, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
              cursor: "pointer", fontFamily: FONT_BODY, fontWeight: 600,
            }}
            onClick={onLogout}
          >
            {initials}
          </div>
        ) : (
          <button
            onClick={onLogin}
            style={{
              width: 34, height: 34, borderRadius: "50%", background: C.cream,
              border: `1px solid ${C.border}`, display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", color: C.muted,
            }}
          >
            <User size={16} />
          </button>
        )}
      </div>
    </header>
  );
}
