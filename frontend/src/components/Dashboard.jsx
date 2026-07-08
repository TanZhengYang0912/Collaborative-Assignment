import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import DiscoveryHeader from "./discovery/DiscoveryHeader";
import FilterChips from "./discovery/FilterChips";
import VendorCard from "./discovery/VendorCard";
import VendorDetailModal from "./discovery/VendorDetailModal";
import { C, FONT_DISPLAY, FONT_BODY } from "../lib/theme";
import { categoryOf } from "../lib/vendorDisplay";

// The map-page discovery dashboard. DiscoveryHeader (logo/search/List·Map/avatar)
// + Vendors/Bookmarks/My reviews tab strip. Vendors come from Supabase.
export default function Dashboard({ vendors, bookmarks, onToggleBookmark, onOpenMap, tripVendorIds, onAddStop }) {
  const [tab, setTab] = useState("vendors");
  const [session, setSession] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [detailVendor, setDetailVendor] = useState(null);
  const navigate = useNavigate();
  const bookmarked = vendors.filter((v) => bookmarks.has(v.id));

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); };
  const userEmail = session?.user?.email || "";
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "?";

  function matchesSearch(v) {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return v.name?.toLowerCase().includes(q)
      || (v.cuisine_types || "").toLowerCase().includes(q)
      || (v.signature_dishes || "").toLowerCase().includes(q);
  }
  function matchesCategory(v) {
    return category === "all" || categoryOf(v) === category;
  }

  const displayed = vendors.filter((v) => matchesSearch(v) && matchesCategory(v));
  const isInTrip = (id) => tripVendorIds?.has(id) ?? false;

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: FONT_BODY }}>
      <DiscoveryHeader
        search={search} onSearchChange={setSearch}
        onOpenMap={onOpenMap}
        session={session} userEmail={userEmail} initials={initials}
        onLogin={() => navigate("/login")} onLogout={handleLogout}
      />

      {/* Tab strip */}
      <nav style={{
        background: C.card, borderBottom: `1px solid ${C.border}`,
        display: "flex", gap: 24, padding: "0 24px",
      }}>
        {[
          ["vendors",   "Vendors"],
          ["bookmarks", `Bookmarks${bookmarked.length ? ` (${bookmarked.length})` : ""}`],
          ["reviews",   "My reviews"],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "12px 2px", fontSize: 14, fontFamily: FONT_BODY,
              color: tab === key ? C.navy : C.muted,
              borderBottom: tab === key ? `2px solid ${C.gold}` : "2px solid transparent",
              fontWeight: tab === key ? 600 : 400,
            }}>
            {label}
          </button>
        ))}
      </nav>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
        {tab === "vendors" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 4 }}>
              <div>
                <h1 style={{
                  fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 700,
                  color: C.navy, margin: 0, lineHeight: 1.2,
                }}>
                  Hidden gems,{" "}
                  <span style={{ color: C.gold, fontStyle: "italic" }}>authentic flavours</span>
                </h1>
                <p style={{ color: C.muted, fontSize: 14, margin: "4px 0 0" }}>
                  {vendors.length} places waiting to be discovered
                </p>
              </div>
              <div style={{ color: C.gold, fontSize: 14 }}>♡ {bookmarked.length} saved</div>
            </div>

            <div style={{ margin: "16px -24px 0" }}>
              <FilterChips active={category} onSelect={setCategory} />
            </div>

            {displayed.length === 0 ? (
              <Empty icon="🍽" text="No vendors match your search yet." />
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 20, marginTop: 20,
              }}>
                {displayed.map((v) => (
                  <VendorCard
                    key={v.id} vendor={v}
                    inTrip={isInTrip(v.id)} bookmarked={bookmarks.has(v.id)}
                    onToggleBookmark={onToggleBookmark} onAddStop={onAddStop}
                    onOpenDetail={setDetailVendor}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "bookmarks" && (
          <>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700, color: C.navy, margin: "0 0 16px" }}>
              Your bookmarks
            </h1>
            {bookmarked.length === 0 ? (
              <Empty icon="🔖" text="No bookmarks yet. Tap the heart on a vendor to save it here." />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
                {bookmarked.map((v) => (
                  <VendorCard
                    key={v.id} vendor={v}
                    inTrip={isInTrip(v.id)} bookmarked
                    onToggleBookmark={onToggleBookmark} onAddStop={onAddStop}
                    onOpenDetail={setDetailVendor}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "reviews" && (
          <>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700, color: C.navy, margin: "0 0 16px" }}>
              My reviews
            </h1>
            <Empty icon="⭐" text="No reviews yet. Your ratings and reviews will appear here." />
          </>
        )}
      </main>

      {detailVendor && (
        <VendorDetailModal
          vendor={detailVendor}
          inTrip={isInTrip(detailVendor.id)} bookmarked={bookmarks.has(detailVendor.id)}
          onToggleBookmark={onToggleBookmark} onAddStop={onAddStop}
          onClose={() => setDetailVendor(null)}
        />
      )}
    </div>
  );
}

function Empty({ icon, text }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
      padding: "48px 24px", textAlign: "center", color: C.muted, marginTop: 20,
    }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 14 }}>{text}</div>
    </div>
  );
}
