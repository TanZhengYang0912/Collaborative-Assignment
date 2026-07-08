import { Link } from "react-router-dom";
import { C, FONT_DISPLAY, FONT_BODY } from "../../lib/theme";
import { ArrowRight } from "lucide-react";

// "DISCOVER LOCAL GEMS / Find what the locals eat." CTA section.
// Clean cream section with centred editorial type and a navy pill CTA.
export default function LocalGemsCta() {
  return (
    <section style={{
      background: C.cream,
      padding: "120px 48px",
      textAlign: "center",
      boxSizing: "border-box",
    }}>
      {/* Eyebrow */}
      <div style={{
        fontFamily: FONT_BODY, fontWeight: 600, fontSize: 11,
        color: C.gold, letterSpacing: 3.5, textTransform: "uppercase",
        marginBottom: 20,
        display: "inline-flex", alignItems: "center", gap: 14,
      }}>
        <span style={{ display: "block", width: 28, height: 1.5, background: C.gold }} />
        Discover Local Gems
        <span style={{ display: "block", width: 28, height: 1.5, background: C.gold }} />
      </div>

      {/* Headline */}
      <h2 style={{
        fontFamily: FONT_DISPLAY, fontWeight: 700,
        fontSize: "clamp(30px, 5vw, 60px)",
        color: C.navy, margin: "0 0 20px", lineHeight: 1.15,
      }}>
        Find what the locals eat.
      </h2>

      {/* Subtitle */}
      <p style={{
        fontFamily: FONT_BODY, fontSize: 17, color: C.muted,
        maxWidth: 540, margin: "0 auto 44px", lineHeight: 1.7,
      }}>
        AI-extracted recommendations from the TikTok creators who actually live
        here. No algorithms. No sponsored listings. Just the real Melaka.
      </p>

      {/* CTA */}
      <Link
        to="/map"
        style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          padding: "16px 36px", borderRadius: 32,
          background: C.navy, color: "#fff",
          fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, letterSpacing: 1.2,
          textDecoration: "none", textTransform: "uppercase",
          boxShadow: "0 4px 20px rgba(27,42,74,0.25)",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 8px 28px rgba(27,42,74,0.32)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(27,42,74,0.25)";
        }}
      >
        Start Exploring <ArrowRight size={16} />
      </Link>
    </section>
  );
}
