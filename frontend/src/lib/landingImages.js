// Curated, Melaka-specific image constants for the editorial landing page.
// Every image is sourced from Wikimedia Commons so the subject matches the
// copy instead of relying on generic travel photography with a misleading alt.

const COMMONS_FILE = "https://commons.wikimedia.org/wiki/Special:FilePath/";

const commonsImage = (fileName, width) =>
  `${COMMONS_FILE}${encodeURIComponent(fileName)}?width=${width}`;

// ─── Hero carousel (4 slides) ─────────────────────────────────────────────────
// The sequence moves from place → street → dish → dish: a compact visual
// introduction to what makes Melaka a hidden gem.
export const HERO_SLIDES = [
  {
    id: 1,
    url: commonsImage("CHRIST CHURCH MELAKA.jpg", 1600),
    eyebrow: "Dutch Square",
    caption: "The red heart of Melaka's heritage",
    alt: "Christ Church Melaka and the red Dutch Square in the historic centre",
    source: "https://commons.wikimedia.org/wiki/File:CHRIST_CHURCH_MELAKA.jpg",
  },
  {
    id: 2,
    url: commonsImage("Jonker Walk.JPG", 1600),
    eyebrow: "Jonker Walk",
    caption: "Where the night market comes alive",
    alt: "Jonker Walk night market in Melaka with its illuminated heritage arch",
    source: "https://commons.wikimedia.org/wiki/File:Jonker_Walk.JPG",
  },
  {
    id: 3,
    url: commonsImage("Nyonya Laksa.jpg", 1200),
    eyebrow: "Nyonya Table",
    caption: "A bowl of heritage, one spoonful at a time",
    alt: "A bowl of Nyonya laksa, a signature Peranakan dish from Melaka",
    source: "https://commons.wikimedia.org/wiki/File:Nyonya_Laksa.jpg",
  },
  {
    id: 4,
    url: commonsImage("Chicken rice balls in Melaka.jpg", 1400),
    eyebrow: "Melaka Flavours",
    caption: "The city's most iconic comfort food",
    alt: "Chicken and rice balls served as a traditional Melaka meal",
    source: "https://commons.wikimedia.org/wiki/File:Chicken_rice_balls_in_Melaka.jpg",
  },
];

// ─── Heritage section ─────────────────────────────────────────────────────────
export const HERITAGE_IMAGE = {
  url: commonsImage("Melaka, Malaysia - Restoran Nyonya Ole Sayang.jpg", 1200),
  alt: "Restoran Nyonya Ole Sayang, a traditional Peranakan restaurant in Melaka",
  caption: "Ole Sayang — a taste of Nyonya heritage",
  source:
    "https://commons.wikimedia.org/wiki/File:Melaka,_Malaysia_-_Restoran_Nyonya_Ole_Sayang.jpg",
};

// ─── Bento / Experience grid (4 cells) ───────────────────────────────────────
export const BENTO_IMAGES = [
  {
    id: "melaka-river",
    url: commonsImage("Melaka (Malacca) River.jpg", 1400),
    label: "Melaka River",
    alt: "The Melaka River flowing past colourful riverside buildings and boats",
    source: "https://commons.wikimedia.org/wiki/File:Melaka_(Malacca)_River.jpg",
  },
  {
    id: "trishaw",
    url: commonsImage("Malacca Trishaw (2494244181).jpg", 1200),
    label: "Melaka Trishaw",
    alt: "A colourful decorated trishaw outside the red heritage buildings of Melaka",
    source: "https://commons.wikimedia.org/wiki/File:Malacca_Trishaw_(2494244181).jpg",
  },
  {
    id: "street-art",
    url: commonsImage("Street Art at Melaka City (3).jpg", 1200),
    label: "Mural Lane",
    alt: "A street art mural in Melaka's historic Chinatown quarter",
    source: "https://commons.wikimedia.org/wiki/File:Street_Art_at_Melaka_City_(3).jpg",
  },
  {
    id: "cendol",
    url: commonsImage("Akaka Cendol.jpg", 1200),
    label: "Cendol Culture",
    alt: "A colourful cendol dessert shop in Melaka",
    source: "https://commons.wikimedia.org/wiki/File:Akaka_Cendol.jpg",
  },
];

// ─── Full-bleed quote / shophouse backdrop ────────────────────────────────────
export const QUOTE_IMAGE = {
  url: commonsImage("Jonker Walk.JPG", 1600),
  alt: "The illuminated Jonker Walk heritage street in Melaka at night",
  source: "https://commons.wikimedia.org/wiki/File:Jonker_Walk.JPG",
};
