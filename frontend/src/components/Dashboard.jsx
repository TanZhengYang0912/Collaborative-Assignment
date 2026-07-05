import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

// Warm "foodie" palette (cream + orange)
const C = {
  cream: "#FBF4EA",
  card: "#FFFFFF",
  accent: "#D85A30",
  accentDark: "#993C1D",
  text: "#3E2C23",
  muted: "#9A8478",
  border: "#EADBCB",
};

// The user dashboard (home). Top-bar layout, three tabs. Vendors come from
// Supabase: { id, name, address, latitude, longitude }.
export default function Dashboard({ vendors, bookmarks, onToggleBookmark, onOpenVendor, onOpenMap }) {
  const [tab, setTab] = useState("vendors");
  const [session, setSession] = useState(null);
  const navigate = useNavigate();
  const bookmarked = vendors.filter((v) => bookmarks.has(v.id));

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const userEmail = session?.user?.email || "";
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "?";

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "system-ui" }}>
      <header style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.accentDark, fontSize: 18, fontWeight: 600 }}>🍜 TrueBites</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {session ? (
            <>
              <span style={{ fontSize: 14, color: C.text }}>{userEmail}</span>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{initials}</div>
              <button onClick={handleLogout} style={{ fontSize: 13, color: C.muted, background: "none", border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 12px", cursor: "pointer" }}>
                Log out
              </button>
            </>
          ) : (
            <button onClick={() => navigate("/login")} style={{ fontSize: 13, background: C.accent, color: "#fff", border: "none", borderRadius: 6, padding: "7px 16px", cursor: "pointer", fontWeight: 500 }}>
              Log in
            </button>
          )}
        </div>
      </header>

      <nav style={{ background: C.card, borderBottom: `1px solid ${C.border}`, display: "flex", gap: 24, padding: "0 24px" }}>
        {[
          ["vendors", "Vendors"],
          ["bookmarks", `Bookmarks${bookmarked.length ? ` (${bookmarked.length})` : ""}`],
          ["reviews", "My reviews"],
          ["map", "Map"],
        ].map(([key, label]) => (
          <button key={key} onClick={() => (key === "map" ? onOpenMap() : setTab(key))}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "12px 2px", fontSize: 14, color: tab === key ? C.accentDark : C.muted, borderBottom: tab === key ? `2px solid ${C.accent}` : "2px solid transparent" }}>
            {label}
          </button>
        ))}
      </nav>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px" }}>
        {tab === "vendors" && (
          <>
            <h2 style={{ color: C.text, fontSize: 20, margin: "0 0 16px" }}>Hidden gems in Melaka</h2>
            {vendors.length === 0
              ? <Empty icon="🍽" text="No vendors yet. They'll appear here once added to the database." />
              : <VendorTable rows={vendors} bookmarks={bookmarks} onToggleBookmark={onToggleBookmark} onOpenVendor={onOpenVendor} />}
          </>
        )}
        {tab === "bookmarks" && (
          <>
            <h2 style={{ color: C.text, fontSize: 20, margin: "0 0 16px" }}>Your bookmarks</h2>
            {bookmarked.length === 0
              ? <Empty icon="🔖" text="No bookmarks yet. Tap the heart on a vendor to save it here." />
              : <VendorTable rows={bookmarked} bookmarks={bookmarks} onToggleBookmark={onToggleBookmark} onOpenVendor={onOpenVendor} />}
          </>
        )}
        {tab === "reviews" && (
          <>
            <h2 style={{ color: C.text, fontSize: 20, margin: "0 0 16px" }}>My reviews</h2>
            <Empty icon="⭐" text="No reviews yet. Your ratings and reviews will appear here." />
          </>
        )}
      </main>
    </div>
  );
}

function VendorTable({ rows, bookmarks, onToggleBookmark, onOpenVendor }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ color: C.muted, textAlign: "left" }}>
            <th style={{ padding: "12px 16px", fontWeight: 500 }}>Vendor</th>
            <th style={{ padding: "12px 16px", width: 50 }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((v) => (
            <tr key={v.id} onClick={() => onOpenVendor(v)}
              style={{ cursor: "pointer", borderTop: `1px solid ${C.border}` }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.cream)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <td style={{ padding: "12px 16px", color: C.text }}>
                {v.name}
                {v.address && <div style={{ fontSize: 12, color: C.muted }}>{v.address}</div>}
              </td>
              <td style={{ padding: "12px 16px" }}>
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleBookmark(v.id); }}
                  aria-label={bookmarks.has(v.id) ? "Remove bookmark" : "Add bookmark"}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: bookmarks.has(v.id) ? C.accent : "#cdbcb0" }}
                >
                  {bookmarks.has(v.id) ? "♥" : "♡"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty({ icon, text }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "48px 24px", textAlign: "center", color: C.muted }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 14 }}>{text}</div>
    </div>
  );
}
