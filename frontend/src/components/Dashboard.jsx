import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { supabase } from "../supabaseClient";
import DiscoveryHeader from "./discovery/DiscoveryHeader";
import FilterChips from "./discovery/FilterChips";
import VendorCard from "./discovery/VendorCard";
import VendorDetailModal from "./discovery/VendorDetailModal";
import GuestPrompt from "./discovery/GuestPrompt";
import { FONT_DISPLAY, FONT_BODY } from "../lib/theme";
import { categoryMatches, creatorHandle } from "../lib/vendorDisplay";
import { pageNumbers, paginate } from "../lib/pagination";
import { ENGAGEMENT_TEST_MODE } from "../lib/testMode";

const PAGE_SIZE = 12;

// The map-page discovery dashboard. DiscoveryHeader (logo/search/List·Map/avatar)
// + Vendors/Bookmarks/My reviews tab strip. Vendors come from Supabase.
export default function Dashboard({ vendors, bookmarks, onToggleBookmark, onOpenMap, tripVendorIds, onAddStop }) {
  const [session, setSession] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [creator, setCreator] = useState("all");
  const [page, setPage] = useState(1);
  const [detailVendor, setDetailVendor] = useState(null);
  const [guestPromptOpen, setGuestPromptOpen] = useState(false);
  const navigate = useNavigate();
  const bookmarked = vendors.filter((v) => bookmarks.has(v.id));

  // Guests can browse freely but can't bookmark, add personal trip stops
  // tied to an account, or view "My reviews" — nudge them to log in instead.
  function requireAuth(fn) {
    return (...args) => {
      if (!session && !ENGAGEMENT_TEST_MODE) { setGuestPromptOpen(true); return; }
      fn(...args);
    };
  }
  const guardedToggleBookmark = requireAuth(onToggleBookmark);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, category, creator]);

  const meta = session?.user?.user_metadata || {};
  const userEmail = session?.user?.email || "";
  const avatarUrl = meta.avatar_url || "";
  const firstName = meta.first_name || "";
  const initials = firstName
    ? (meta.first_name?.[0] || "") + (meta.last_name?.[0] || "")
    : (userEmail ? userEmail.slice(0, 2).toUpperCase() : "?");

  function matchesSearch(v) {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return v.name?.toLowerCase().includes(q)
      || (v.cuisine_types || "").toLowerCase().includes(q)
      || (v.signature_dishes || "").toLowerCase().includes(q);
  }
  function matchesCategory(v) {
    return categoryMatches(v, category);
  }
  function matchesCreator(v) {
    return creator === "all" || creatorHandle(v) === creator;
  }

  const displayed = vendors.filter((v) => matchesSearch(v) && matchesCategory(v) && matchesCreator(v));
  const pageData = paginate(displayed, page, PAGE_SIZE);
  useEffect(() => {
    if (page > pageData.totalPages) setPage(pageData.totalPages);
  }, [page, pageData.totalPages]);
  const isInTrip = (id) => tripVendorIds?.has(id) ?? false;

  return (
    <div className="discovery-page" style={{ fontFamily: FONT_BODY }}>
      <DiscoveryHeader
        onOpenMap={onOpenMap}
        session={session} userEmail={userEmail} initials={initials} firstName={firstName} avatarUrl={avatarUrl} savedCount={bookmarked.length}
        onLogin={() => navigate("/login")} onOpenProfile={() => navigate("/profile")}
        activeSection="discover"
        onOpenDiscover={() => navigate("/map")}
        onOpenSaved={requireAuth(() => navigate("/engagement"))}
        onOpenReviews={requireAuth(() => navigate("/engagement?tab=reviews"))}
        onSignUp={() => navigate("/login")}
      />

      <main className="discovery-main">
        <>
            <div className="discovery-hero">
              <div>
                <p className="discovery-kicker">A local guide to Melaka</p>
                <h1 className="discovery-title" style={{ fontFamily: FONT_DISPLAY }}>
                  Hidden gems,{" "}
                  <span className="discovery-title-emphasis">authentic flavours</span>
                </h1>
                <p className="discovery-subtitle">
                  {vendors.length} places waiting to be discovered
                </p>
              </div>
              <label className="discovery-search">
                <Search size={18} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search Nasi Lemak, Jonker, Kopitiam…"
                  aria-label="Search places"
                />
              </label>
            </div>

            <FilterChips
              active={category}
              onSelect={setCategory}
              creator={creator}
              onCreatorSelect={setCreator}
              vendors={vendors}
            />

            {displayed.length === 0 ? (
              <Empty onClear={() => { setSearch(""); setCategory("all"); setCreator("all"); }} />
            ) : (
              <>
                <div className="discovery-grid">
                  {pageData.items.map((v) => (
                    <VendorCard
                      key={v.id} vendor={v}
                      inTrip={isInTrip(v.id)} bookmarked={bookmarks.has(v.id)}
                      onToggleBookmark={guardedToggleBookmark} onAddStop={onAddStop}
                      onOpenDetail={setDetailVendor}
                    />
                  ))}
                </div>
                <Pagination
                  page={pageData.page}
                  totalPages={pageData.totalPages}
                  total={pageData.total}
                  onChange={setPage}
                />
              </>
            )}
        </>
      </main>

      {detailVendor && (
        <VendorDetailModal
          vendor={detailVendor}
          inTrip={isInTrip(detailVendor.id)} bookmarked={bookmarks.has(detailVendor.id)}
          onToggleBookmark={guardedToggleBookmark} onAddStop={onAddStop}
          onClose={() => setDetailVendor(null)}
        />
      )}

      <GuestPrompt open={guestPromptOpen} onClose={() => setGuestPromptOpen(false)} />
    </div>
  );
}

function Empty({ onClear }) {
  return (
    <div className="discovery-empty">
      <h2 className="discovery-empty-title">No places found</h2>
      <p className="discovery-empty-copy">Try a different category, creator, or search term.</p>
      <button type="button" className="discovery-clear-button" onClick={onClear}>Clear filters</button>
    </div>
  );
}

function Pagination({ page, totalPages, total, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <nav className="discovery-pagination" aria-label="Vendor pages">
      <span className="discovery-pagination-meta">
        {total} places · Page {page} of {totalPages}
      </span>
      <div className="discovery-pagination-controls">
        <button
          type="button"
          className="discovery-pagination-button"
          aria-label="Previous page"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        {pageNumbers(page, totalPages).map((item, index) => item === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="discovery-pagination-ellipsis" aria-hidden="true">…</span>
        ) : (
          <button
            key={item}
            type="button"
            className={`discovery-pagination-page${item === page ? " discovery-pagination-page-active" : ""}`}
            aria-label={`Page ${item}`}
            aria-current={item === page ? "page" : undefined}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ))}
        <button
          type="button"
          className="discovery-pagination-button"
          aria-label="Next page"
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
