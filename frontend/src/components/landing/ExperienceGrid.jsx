import { C, FONT_DISPLAY, FONT_BODY } from "../../lib/theme";
import { BENTO_IMAGES } from "../../lib/landingImages";

// "EXPERIENCE MELAKA / A city like no other." bento photo grid.
// Layout: 2-column CSS Grid with the first image spanning 2 rows (large hero cell),
// then 3 regular cells filling the right column.
export default function ExperienceGrid() {
  return (
    <section
      id="experience-section"
      style={{ background: C.navy, padding: "100px 48px", boxSizing: "border-box" }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {/* Section header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{
            fontFamily: FONT_BODY, fontWeight: 600, fontSize: 11,
            color: C.gold, letterSpacing: 3, textTransform: "uppercase",
            marginBottom: 16, display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ display: "block", width: 28, height: 1.5, background: C.gold }} />
            Experience Melaka
          </div>
          <h2 style={{
            fontFamily: FONT_DISPLAY, fontSize: "clamp(30px, 4vw, 52px)",
            fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.15,
          }}>
            A city like no other.
          </h2>
        </div>

        {/* Bento grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gridTemplateRows: "300px 300px",
          gap: 12,
        }}>
          {/* Large hero cell — spans 2 rows */}
          <BentoCell img={BENTO_IMAGES[0]} rowSpan />

          {/* Two smaller cells stacked */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, gridRow: "1 / -1", minHeight: 0 }}>
            <BentoCell img={BENTO_IMAGES[1]} grow />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, flex: 1 }}>
              <BentoCell img={BENTO_IMAGES[2]} />
              <BentoCell img={BENTO_IMAGES[3]} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BentoCell({ img, rowSpan, grow }) {
  return (
    <div style={{
      position: "relative", overflow: "hidden", borderRadius: 4,
      gridRow: rowSpan ? "1 / -1" : undefined,
      flex: grow ? "1 1 0" : undefined,
      minHeight: 0,
    }}>
      <img
        src={img.url}
        alt={img.alt}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      {/* Overlay gradient */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, rgba(27,42,74,0.75) 0%, transparent 50%)",
      }} />
      {/* Label */}
      <div style={{
        position: "absolute", bottom: 16, left: 16,
        fontFamily: FONT_DISPLAY, fontWeight: 700,
        fontSize: rowSpan ? 22 : 15, color: "#fff",
        letterSpacing: 0.5,
      }}>
        {img.label}
      </div>
    </div>
  );
}
