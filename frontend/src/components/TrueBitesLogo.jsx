import { FONT_DISPLAY, FONT_BODY, C } from "../lib/theme";

export default function TrueBitesLogo({ size = "auth", tone = "default" }) {
  return (
    <span className={`truebites-logo-markup is-${size} is-${tone}`}>
      <span className="truebites-logo-mark" style={{ fontFamily: FONT_DISPLAY, color: C.navy }}>TB</span>
      <span className="truebites-logo-copy">
        <span className="truebites-logo-title" style={{ fontFamily: FONT_DISPLAY }}>TRUEBITES</span>
        <span className="truebites-logo-sub" style={{ fontFamily: FONT_BODY, color: C.gold }}>MELAKA · MALAYSIA</span>
      </span>
    </span>
  );
}
