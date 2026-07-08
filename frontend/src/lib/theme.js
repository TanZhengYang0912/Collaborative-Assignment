// Shared design tokens — navy/gold/cream identity (Collab-Testing Figma pass).
// All discovery, modal, trip-panel, and landing components read from here so a
// single palette update propagates everywhere.
export const C = {
  navy:      "#1B2A4A",   // primary dark — buttons, badges, active toggles, stats band, footer
  navyLight: "#243659",   // slightly lighter navy for hover states
  gold:      "#B8933F",   // accent — eyebrows, AI-review border + label, one accent per section
  goldLight: "#D4AA58",   // lighter gold for hover/active
  cream:     "#F4F1EA",   // page background
  card:      "#FFFFFF",   // card / modal surface
  text:      "#1B2A4A",   // primary text (navy for strong contrast on cream)
  muted:     "#6B6B6B",   // secondary / meta text
  border:    "#E2DACE",   // subtle dividers on cream
  success:   "#2a9d8f",   // kept for transit/GPS indicator

  // Aliases for backwards compatibility with components that used old names
  accent:     "#B8933F",  // gold
  accentDark: "#8C6D2F",  // darker gold
};

export const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
export const FONT_BODY    = "'Inter', system-ui, sans-serif";
