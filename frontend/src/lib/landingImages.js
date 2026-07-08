// Curated, URL-verified Unsplash landmark image constants for the Melaka
// editorial landing page. Keeping these in one place makes it trivial to swap
// in real licensed photography later without touching any component.
//
// All URLs use Unsplash's image CDN with explicit crop dimensions so they
// don't shift aspect-ratios on slow connections.

// ─── Hero carousel (4 slides) ─────────────────────────────────────────────────
// Full-bleed portrait/landscape, shown one at a time behind the giant "MELAKA"
// wordmark. Choose images with readable sky/shadow areas where the text overlays.

export const HERO_SLIDES = [
  {
    id: 1,
    url:     "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1600&h=900&fit=crop&q=85",
    eyebrow: "Christ Church Melaka",
    caption: "Est. 1753 — Dutch Colonial Heritage",
    alt:     "Christ Church Melaka, the iconic red Dutch colonial church",
  },
  {
    id: 2,
    url:     "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&h=900&fit=crop&q=85",
    eyebrow: "Jonker Walk",
    caption: "Est. 1650s — The Heritage Bazaar",
    alt:     "Jonker Walk night market, colourful shophouses in Melaka",
  },
  {
    id: 3,
    url:     "https://images.unsplash.com/photo-1551009175-8a68da93d5f9?w=1600&h=900&fit=crop&q=85",
    eyebrow: "Street Art Quarter",
    caption: "A canvas of culture on every wall",
    alt:     "Vibrant street art murals in the heritage streets of Melaka",
  },
  {
    id: 4,
    url:     "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=1600&h=900&fit=crop&q=85",
    eyebrow: "Festival Lanterns",
    caption: "Where six centuries of tradition glow",
    alt:     "Golden lanterns hanging in Melaka's heritage quarter at dusk",
  },
];

// ─── Heritage section ─────────────────────────────────────────────────────────
// Large captioned image beside the editorial copy block.
export const HERITAGE_IMAGE = {
  url: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=900&h=680&fit=crop&q=85",
  alt: "Traditional red lanterns hanging in Melaka, symbolising centuries of Chinese-Malay cultural heritage",
  caption: "Lanterns of the Jonker Heritage Quarter",
};

// ─── Bento / Experience grid (4 cells) ───────────────────────────────────────
export const BENTO_IMAGES = [
  {
    id: "jonker",
    url:   "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&q=80",
    label: "Jonker Walk",
    alt:   "The famous Jonker Walk heritage street",
  },
  {
    id: "church",
    url:   "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&h=600&fit=crop&q=80",
    label: "Christ Church",
    alt:   "Christ Church Melaka, red colonial landmark",
  },
  {
    id: "hawker",
    url:   "https://images.unsplash.com/photo-1543353071-873f17a7a088?w=800&h=600&fit=crop&q=80",
    label: "Hawker Culture",
    alt:   "Hawker stalls serving authentic Malaysian street food",
  },
  {
    id: "mural",
    url:   "https://images.unsplash.com/photo-1551009175-8a68da93d5f9?w=800&h=600&fit=crop&q=80",
    label: "Street Art",
    alt:   "Melaka street art murals celebrating local culture",
  },
];

// ─── Full-bleed quote / shophouse backdrop ────────────────────────────────────
export const QUOTE_IMAGE = {
  url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&h=900&fit=crop&q=85",
  alt: "A colourful Peranakan shophouse street in Melaka at golden hour",
};
