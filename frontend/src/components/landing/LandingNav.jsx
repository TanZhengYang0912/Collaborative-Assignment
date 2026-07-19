import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { C, FONT_DISPLAY, FONT_BODY } from "../../lib/theme";

// Transparent over the hero, transitions to solid cream on scroll.
// Logo: TRUEBITES (Playfair) + MELAKA · MALAYSIA sub-label (Inter caps).
// Links: DISCOVER + EXPLORE scroll to page sections; PLAN VISIT → /map.
export default function LandingNav({ heroRef }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollTo(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      padding: "16px 48px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: scrolled ? "rgba(244,241,234,0.96)" : "transparent",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      borderBottom: scrolled ? `1px solid ${C.border}` : "none",
      transition: "background 0.3s ease, border-color 0.3s ease",
    }}>
      {/* Wordmark */}
      <Link
        to="/"
        aria-label="Back to TrueBites home"
        style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
      >
        <div style={{
          width: 34, height: 34, borderRadius: 7, background: C.navy,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <span style={{ color: C.gold, fontSize: 13, fontWeight: 700, fontFamily: FONT_DISPLAY }}>TB</span>
        </div>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{
            fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16,
            color: scrolled ? C.navy : "#fff", letterSpacing: 0.4,
          }}>TRUEBITES</div>
          <div style={{
            fontFamily: FONT_BODY, fontWeight: 500, fontSize: 9,
            color: scrolled ? C.gold : "rgba(255,255,255,0.8)",
            letterSpacing: 1.8, textTransform: "uppercase",
          }}>MELAKA · MALAYSIA</div>
        </div>
      </Link>

      {/* Links */}
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        {[
          { label: "DISCOVER",  action: () => scrollTo("heritage-section") },
          { label: "EXPLORE",   action: () => scrollTo("experience-section") },
        ].map(({ label, action }) => (
          <button
            key={label}
            onClick={action}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 600, letterSpacing: 1.8,
              color: scrolled ? C.navy : "rgba(255,255,255,0.85)",
              textTransform: "uppercase",
            }}
          >
            {label}
          </button>
        ))}

        <Link to="/map" style={{
          padding: "9px 22px", borderRadius: 24,
          background: C.navy, color: "#fff",
          fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, letterSpacing: 1,
          textDecoration: "none", textTransform: "uppercase",
          border: `1.5px solid ${scrolled ? C.navy : "rgba(255,255,255,0.7)"}`,
          transition: "background 0.2s",
        }}>
          Plan Visit
        </Link>
      </div>
    </nav>
  );
}
