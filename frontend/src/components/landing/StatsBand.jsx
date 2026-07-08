import { C, FONT_DISPLAY, FONT_BODY } from "../../lib/theme";

// Navy band with three Playfair stat numbers (600+ / 14 / UNESCO).
export default function StatsBand() {
  const stats = [
    { number: "600+", label: "Years of Heritage" },
    { number: "14",   label: "Ethnic Cuisines" },
    { number: "UNESCO", label: "World Heritage City" },
  ];

  return (
    <div style={{
      background: C.navy,
      padding: "72px 48px",
      display: "flex", justifyContent: "center", gap: 0,
    }}>
      <div style={{
        display: "flex", width: "100%", maxWidth: 960,
        alignItems: "center",
      }}>
        {stats.map((s, i) => (
          <div key={s.label} style={{ display: "flex", alignItems: "stretch", flex: 1 }}>
            {/* Divider */}
            {i > 0 && (
              <div style={{
                width: 1, background: "rgba(255,255,255,0.12)",
                alignSelf: "stretch", margin: "0 0",
              }} />
            )}
            <div style={{
              flex: 1, textAlign: "center", padding: "0 32px",
            }}>
              <div style={{
                fontFamily: FONT_DISPLAY, fontWeight: 800,
                fontSize: "clamp(36px, 5vw, 64px)",
                color: "#fff", lineHeight: 1, marginBottom: 10,
                letterSpacing: "-0.01em",
              }}>
                {s.number}
              </div>
              <div style={{
                fontFamily: FONT_BODY, fontWeight: 500, fontSize: 12,
                color: C.gold, letterSpacing: 2.5, textTransform: "uppercase",
              }}>
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
