import { C, FONT_DISPLAY, FONT_BODY } from "../../lib/theme";
import { QUOTE_IMAGE } from "../../lib/landingImages";

// Full-bleed shophouse photo backdrop with "PERANAKAN HERITAGE" eyebrow
// and a big italic serif pull-quote.
export default function QuoteSection() {
  return (
    <section style={{ position: "relative", height: "70vh", overflow: "hidden" }}>
      {/* Background image */}
      <img
        src={QUOTE_IMAGE.url}
        alt={QUOTE_IMAGE.alt}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />

      {/* Dark overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(135deg, rgba(27,42,74,0.82) 0%, rgba(27,42,74,0.45) 100%)",
      }} />

      {/* Content */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "0 48px", textAlign: "center",
      }}>
        {/* Eyebrow */}
        <div style={{
          fontFamily: FONT_BODY, fontWeight: 600, fontSize: 11,
          color: C.gold, letterSpacing: 3.5, textTransform: "uppercase",
          marginBottom: 28,
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <span style={{ display: "block", width: 32, height: 1.5, background: C.gold }} />
          Peranakan Heritage
          <span style={{ display: "block", width: 32, height: 1.5, background: C.gold }} />
        </div>

        {/* Pull-quote */}
        <blockquote style={{
          fontFamily: FONT_DISPLAY, fontStyle: "italic",
          fontSize: "clamp(24px, 4vw, 52px)",
          fontWeight: 600, color: "#fff",
          margin: 0, maxWidth: 860, lineHeight: 1.3,
          textShadow: "0 2px 20px rgba(0,0,0,0.3)",
        }}>
          "Nowhere else in the world will you taste this."
        </blockquote>

        {/* Attribution */}
        <div style={{
          marginTop: 24,
          fontFamily: FONT_BODY, fontSize: 13, color: "rgba(255,255,255,0.6)",
          letterSpacing: 0.5,
        }}>
          — The spirit of Melaka's table
        </div>
      </div>
    </section>
  );
}
