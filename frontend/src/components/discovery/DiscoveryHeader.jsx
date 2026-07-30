import { Bookmark, LayoutGrid, Map as MapIcon, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { FONT_BODY } from "../../lib/theme";
import TrueBitesLogo from "../TrueBitesLogo";

// Shared customer header for discovery and map surfaces. Search now lives in
// the discovery hero so the top bar stays quiet and consistent across screens.
export default function DiscoveryHeader({
  onOpenMap,
  session, userEmail, initials, firstName, avatarUrl, onLogin, onOpenProfile, onSignUp,
  onOpenSaved, onOpenReviews, onOpenDiscover, activeSection = "discover",
  savedCount = 0,
  mapActive = false,
}) {
  return (
    <header className="discovery-header" style={{ fontFamily: FONT_BODY }}>
      <Link
        to="/"
        className="discovery-wordmark"
        aria-label="Back to TrueBites home"
        title="Back to home"
        style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, textDecoration: "none" }}
      >
        <TrueBitesLogo size="header" />
      </Link>

      <nav className="discovery-primary-nav" aria-label="Primary navigation">
        <button
          type="button"
          className={`discovery-primary-nav-link${activeSection === "discover" ? " active" : ""}`}
          onClick={() => onOpenDiscover?.()}
          aria-current={activeSection === "discover" ? "page" : undefined}
        >
          Discover
        </button>
        <button
          type="button"
          className={`discovery-primary-nav-link${activeSection === "saved" ? " active" : ""}`}
          onClick={() => onOpenSaved?.()}
          aria-current={activeSection === "saved" ? "page" : undefined}
        >
          <Bookmark size={14} strokeWidth={1.7} />
          <span>Saved</span>
          {savedCount > 0 && <span className="discovery-nav-count">{savedCount}</span>}
        </button>
        <button
          type="button"
          className={`discovery-primary-nav-link${activeSection === "reviews" ? " active" : ""}`}
          onClick={() => onOpenReviews?.()}
          aria-current={activeSection === "reviews" ? "page" : undefined}
        >
          My reviews
        </button>
      </nav>

      <div className="discovery-header-spacer" />

      <div className="discovery-view-toggle" aria-label="View mode">
        {mapActive ? (
          <>
            <button type="button" className="discovery-view-toggle-button" onClick={onOpenDiscover}>
              <LayoutGrid size={14} /> List
            </button>
            <span className="discovery-view-toggle-active"><MapIcon size={14} /> Map</span>
          </>
        ) : (
          <>
            <span className="discovery-view-toggle-active"><LayoutGrid size={14} /> List</span>
            <button type="button" className="discovery-view-toggle-button" onClick={onOpenMap}>
              <MapIcon size={14} /> Map
            </button>
          </>
        )}
      </div>

      {session ? (
        <button
          type="button"
          className="discovery-avatar"
          onClick={onOpenProfile}
          title={userEmail}
          aria-label={`Open profile${firstName ? ` for ${firstName}` : ""}`}
        >
          {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
        </button>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button type="button" onClick={onSignUp} className="discovery-header-action" style={{ borderColor: "var(--tb-forest)", color: "var(--tb-forest)", fontWeight: 600 }}>
            Sign up
          </button>
          <button type="button" onClick={onLogin} className="discovery-avatar" style={{ background: "transparent", color: "var(--tb-forest)" }} aria-label="Open sign in">
            <UserRound size={16} />
          </button>
        </div>
      )}
    </header>
  );
}
