import { Bookmark, LayoutGrid, Map as MapIcon, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { FONT_BODY } from "../../lib/theme";

// Shared customer header for discovery and map surfaces. Search now lives in
// the discovery hero so the top bar stays quiet and consistent across screens.
export default function DiscoveryHeader({
  onOpenMap,
  session, userEmail, initials, firstName, avatarUrl, onLogin, onOpenProfile, onSignUp,
  onOpenSaved,
  savedCount = 0,
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
        <div className="discovery-wordmark-mark">TB</div>
        <div style={{ lineHeight: 1.1 }}>
          <div className="discovery-wordmark-title">TRUEBITES</div>
          <div className="discovery-wordmark-sub">Melaka · Malaysia</div>
        </div>
      </Link>

      <div className="discovery-header-spacer" />

      <button type="button" className="discovery-header-action" onClick={() => onOpenSaved?.()} aria-label="Open saved places">
        <Bookmark size={15} strokeWidth={1.7} />
        <span>Saved{savedCount ? ` ${savedCount}` : ""}</span>
      </button>

      <div className="discovery-view-toggle" aria-label="View mode">
        <span className="discovery-view-toggle-active"><LayoutGrid size={14} /> List</span>
        <button type="button" className="discovery-view-toggle-button" onClick={onOpenMap}>
          <MapIcon size={14} /> Map
        </button>
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
