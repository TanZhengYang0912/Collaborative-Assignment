import { C, FONT_DISPLAY, FONT_BODY } from "../../lib/theme";
import { HERITAGE_IMAGE } from "../../lib/landingImages";

// "HERITAGE & CULTURE" section — split layout: editorial text left, large
// lantern photo right. Includes UNESCO badge and two body paragraphs.
export default function HeritageSection() {
  return (
    <section
      id="heritage-section"
      style={{
        background: C.cream,
        padding: "100px 48px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 80,
        alignItems: "center",
        maxWidth: 1280,
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      {/* Editorial text column */}
      <div>
        {/* Eyebrow */}
        <div style={{
          fontFamily: FONT_BODY, fontWeight: 600, fontSize: 11,
          color: C.gold, letterSpacing: 3, textTransform: "uppercase",
          marginBottom: 20,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ display: "block", width: 28, height: 1.5, background: C.gold }} />
          Heritage & Culture
        </div>

        {/* Headline */}
        <h2 style={{
          fontFamily: FONT_DISPLAY, fontSize: "clamp(32px, 4vw, 52px)",
          fontWeight: 700, color: C.navy, margin: "0 0 28px",
          lineHeight: 1.2,
        }}>
          Where six centuries of history meet{" "}
          <span style={{ fontStyle: "italic", color: C.navy }}>on a single plate.</span>
        </h2>

        {/* Body */}
        <p style={{
          fontFamily: FONT_BODY, fontSize: 16, color: C.muted,
          lineHeight: 1.8, margin: "0 0 18px",
        }}>
          Melaka's cuisine is a living archive — a flavour record written by Malay
          sultans, Dutch traders, Portuguese explorers, and the Peranakan Baba-Nyonya
          community who wove them all together. Every bowl of asam pedas, every kuih
          talam, every cup of thick kopi tells a chapter of that story.
        </p>
        <p style={{
          fontFamily: FONT_BODY, fontSize: 16, color: C.muted,
          lineHeight: 1.8, margin: "0 0 36px",
        }}>
          TrueBites maps those stories — surfacing the hawker stalls, the
          century-old kopitiam, and the Nyonya kitchens that tourists walk past
          every day without knowing the legend hiding behind the door.
        </p>

        {/* UNESCO badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 12,
          padding: "10px 20px",
          border: `1.5px solid ${C.gold}`,
          borderRadius: 4,
        }}>
          <span style={{ fontSize: 20 }}>🏛</span>
          <div>
            <div style={{
              fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10.5,
              color: C.gold, letterSpacing: 2, textTransform: "uppercase",
            }}>
              UNESCO World Heritage City
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.muted, marginTop: 2 }}>
              Historic Cities of the Straits of Malacca — 2008
            </div>
          </div>
        </div>
      </div>

      {/* Photo column */}
      <div style={{ position: "relative" }}>
        <div style={{
          borderRadius: 4, overflow: "hidden",
          boxShadow: "16px 16px 0 0 rgba(184,147,63,0.15)",
        }}>
          <img
            src={HERITAGE_IMAGE.url}
            alt={HERITAGE_IMAGE.alt}
            style={{ width: "100%", display: "block", objectFit: "cover", aspectRatio: "4/5" }}
          />
        </div>
        {/* Caption tab */}
        <div style={{
          position: "absolute", bottom: -16, right: 24,
          background: C.navy, color: "#fff",
          fontFamily: FONT_BODY, fontSize: 11, letterSpacing: 1.5,
          padding: "8px 16px", textTransform: "uppercase",
        }}>
          {HERITAGE_IMAGE.caption}
        </div>
      </div>
    </section>
  );
}
