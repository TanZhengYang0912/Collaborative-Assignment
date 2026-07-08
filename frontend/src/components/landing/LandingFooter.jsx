import { C, FONT_DISPLAY, FONT_BODY } from "../../lib/theme";

// Navy footer: TRUEBITES wordmark + official tagline + location/AI/year.
export default function LandingFooter() {
  return (
    <footer style={{
      background: C.navy,
      padding: "64px 48px",
      boxSizing: "border-box",
    }}>
      <div style={{
        maxWidth: 1280, margin: "0 auto",
        display: "flex", flexDirection: "column", gap: 32,
      }}>
        {/* Top row: wordmark + nav links */}
        <div style={{
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", flexWrap: "wrap", gap: 32,
        }}>
          {/* Wordmark */}
          <div>
            <div style={{
              fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 28,
              color: "#fff", letterSpacing: 0.5, marginBottom: 6,
            }}>
              TRUEBITES
            </div>
            <div style={{
              fontFamily: FONT_BODY, fontSize: 12, color: C.gold,
              letterSpacing: 1.5, textTransform: "uppercase",
            }}>
              Official Food Discovery Platform · Melaka Tourism
            </div>
          </div>

          {/* Footer links */}
          <div style={{ display: "flex", gap: 36, flexWrap: "wrap", alignItems: "center" }}>
            {[
              "About",
              "Privacy",
              "Contact Melaka Tourism",
            ].map((link) => (
              <span
                key={link}
                style={{
                  fontFamily: FONT_BODY, fontSize: 12, color: "rgba(255,255,255,0.5)",
                  letterSpacing: 0.5, cursor: "pointer",
                }}
              >
                {link}
              </span>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.08)" }} />

        {/* Bottom row */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", flexWrap: "wrap", gap: 16,
        }}>
          <div style={{
            fontFamily: FONT_BODY, fontSize: 12,
            color: "rgba(255,255,255,0.4)", letterSpacing: 0.3,
          }}>
            Melaka, Malaysia · AI-Powered · Est. 2024
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%", background: C.gold,
              display: "inline-block",
            }} />
            <span style={{
              fontFamily: FONT_BODY, fontSize: 11,
              color: "rgba(255,255,255,0.35)", letterSpacing: 0.5,
            }}>
              © 2024 TrueBites. Built for Melaka.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
