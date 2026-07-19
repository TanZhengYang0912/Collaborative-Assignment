// Shared design tokens — contemporary shophouse catalog identity.
// Every surface should read from this file so the customer, admin and AI
// experiences feel like one product rather than separate templates.
export const C = {
  navy:      "#40544A",   // forest — primary actions and active navigation
  navyLight: "#566D60",   // forest hover state
  gold:      "#A35D47",   // terracotta — restrained editorial accent
  goldLight: "#C17C65",   // terracotta hover state
  cream:     "#FAF8F4",   // chalk page background
  card:      "#FFFFFF",   // card / modal surface
  text:      "#202A35",   // ink primary text
  muted:     "#69717A",   // secondary / meta text
  border:    "#D8D2C8",   // soft sand dividers
  success:   "#557A67",   // semantic success / GPS indicator
  warning:   "#A35D47",
  danger:    "#B44E4E",
  ink:       "#202A35",
  forest:    "#40544A",
  terracotta:"#A35D47",
  sand:      "#DDD3C5",
  chalk:     "#FAF8F4",

  // Aliases for backwards compatibility with components that used old names
  accent:     "#40544A",  // primary action
  accentDark: "#2E3D34",  // darker forest
};

export const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
export const FONT_BODY    = "'Inter', system-ui, sans-serif";
