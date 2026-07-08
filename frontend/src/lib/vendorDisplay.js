// Shared display helpers for vendor cards, the detail modal, and trip-panel
// stops — derives presentation data (category, photo, creator handle) from
// columns that already exist, so no schema change is needed for this pass.

// Extended category set to match the Figma filter chips:
//   nyonya    — Peranakan / nyonya / kuih / heritage
//   kopitiam  — kopitiam / kopi / coffee / cafe / bakery / breakfast
//   streetfood — satay / hawker / laksa / char kway / nasi / mee / rice / roti
//   dessert   — cendol / ice / dessert / sweet / cake
// Fall-through → "streetfood" (the most common Melaka food category).
const CATEGORY_KEYWORDS = {
  nyonya:     ["nyonya", "peranakan", "nonya", "baba", "kuih", "heritage", "portuguese"],
  kopitiam:   ["kopitiam", "kopi", "coffee", "cafe", "coff", "espresso", "latte", "bakery", "pastry", "toast"],
  dessert:    ["cendol", "ice cream", "dessert", "cake", "sweet", "ais", "pudding", "yogurt"],
  streetfood: [
    "satay", "hawker", "laksa", "char kway", "char koay", "nasi", "mee ", "rice",
    "roti", "rendang", "ayam", "ikan", "sotong", "prawn", "tom yam", "claypot",
    "wantan", "wonton", "dim sum", "chinese", "traditional", "malay", "indian",
  ],
};

// Human-readable labels used on badges and filter chips
const CATEGORY_LABELS = {
  nyonya:     "Heritage",
  kopitiam:   "Kopitiam",
  dessert:    "Dessert",
  streetfood: "Street Food",
};

export function categoryOf(vendor) {
  // cuisine_types is often a generic "Malaysian / Local" placeholder in this
  // dataset regardless of the actual vendor type — the name (e.g. "Baba Nyonya
  // Kitchen") frequently carries the real signal that field doesn't.
  const text = `${vendor.name || ""} ${vendor.cuisine_types || ""} ${vendor.signature_dishes || ""}`.toLowerCase();
  // Ordered from most specific to broadest so a nyonya restaurant isn't also
  // matched as "streetfood" just because it serves rice.
  if (CATEGORY_KEYWORDS.nyonya.some((k)     => text.includes(k))) return "nyonya";
  if (CATEGORY_KEYWORDS.kopitiam.some((k)   => text.includes(k))) return "kopitiam";
  if (CATEGORY_KEYWORDS.dessert.some((k)    => text.includes(k))) return "dessert";
  if (CATEGORY_KEYWORDS.streetfood.some((k) => text.includes(k))) return "streetfood";
  return "streetfood"; // sensible default for Melaka's food scene
}

export function categoryLabel(vendor) {
  return CATEGORY_LABELS[categoryOf(vendor)] || "Street Food";
}

// ─── Photo placeholders ────────────────────────────────────────────────────────
// Curated Unsplash stock photos per category, used when a vendor has no image_url
// of its own (true for every vendor today; none are stored yet).
const PLACEHOLDER_IMAGES = {
  nyonya: [
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=480&h=360&fit=crop",
    "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=480&h=360&fit=crop",
    "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=480&h=360&fit=crop",
  ],
  kopitiam: [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=480&h=360&fit=crop",
    "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=480&h=360&fit=crop",
    "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=480&h=360&fit=crop",
  ],
  dessert: [
    "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=480&h=360&fit=crop",
    "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=480&h=360&fit=crop",
    "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=480&h=360&fit=crop",
  ],
  streetfood: [
    "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=480&h=360&fit=crop",
    "https://images.unsplash.com/photo-1543353071-873f17a7a088?w=480&h=360&fit=crop",
    "https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=480&h=360&fit=crop",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=480&h=360&fit=crop",
  ],
};

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Deterministic (not random) so the same vendor always shows the same photo
// across renders/reloads, and prefers a real image_url the moment one exists.
export function placeholderImage(vendor) {
  if (vendor.image_url) return vendor.image_url;
  const pool = PLACEHOLDER_IMAGES[categoryOf(vendor)] || PLACEHOLDER_IMAGES.streetfood;
  return pool[hashStr(String(vendor.id)) % pool.length];
}

// "RM8-15 per person" / "RM10" -> "RM8" (first number found); no match -> null.
export function priceLabel(vendor) {
  const match = (vendor.price_range || "").match(/\d+/);
  return match ? `RM${match[0]}` : null;
}

// Backend already computes this via haversine (see /restaurants/nearby).
export function walkLabel(vendor) {
  return vendor.roughEtaWalking != null ? `${vendor.roughEtaWalking} min` : null;
}

export function distanceLabel(vendor) {
  return vendor.distKm != null ? `${vendor.distKm} km` : null;
}

// "Nasi Lemak, Rendang" -> "Nasi Lemak" (first listed dish/cuisine for the tag pill)
export function primaryTag(vendor) {
  const first = (vendor.cuisine_types || vendor.signature_dishes || "").split(",")[0]?.trim();
  return first || null;
}

// "https://www.tiktok.com/@melaka.bites/video/123..." -> "@melaka.bites"
export function creatorHandle(vendor) {
  const url = vendor.source_video_url || "";
  const tiktok = url.match(/tiktok\.com\/@([\w.]+)/i);
  if (tiktok) return `@${tiktok[1]}`;
  if (vendor.source_platform) return `via ${vendor.source_platform}`;
  return null;
}
