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
  const text = `${vendor.name || ""} ${vendor.cuisine_types || ""} ${vendor.signature_dishes || ""} ${vendor.ai_review_summary || ""}`.toLowerCase();
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
// Local Melaka food photos used when a vendor has no image_url of its own.
// This keeps the feed visually varied and avoids repeating the same remote
// stock photo across nearby vendor cards.
import ikanBakar from "../assets/vendor-food/01-ikan-bakar.png";
import rotiCanai from "../assets/vendor-food/02-roti-canai.png";
import kuihAssortment from "../assets/vendor-food/03-kuih-assortment.png";
import claypotNoodle from "../assets/vendor-food/04-claypot-noodle.png";
import cendolShake from "../assets/vendor-food/05-cendol-coconut-shake.png";
import creamyChickenRice from "../assets/vendor-food/06-creamy-chicken-rice-cake.png";
import healthyCafeBowl from "../assets/vendor-food/07-healthy-cafe-bowl.png";
import fusionGreenPlate from "../assets/vendor-food/08-fusion-green-plate.png";
import nyonyaHeritageMeal from "../assets/vendor-food/09-nyonya-heritage-meal.png";
import coconutShakeStall from "../assets/vendor-food/10-coconut-shake-stall.png";
import { VENDOR_FOOD_IMAGES } from "../generated/vendorFoodImages.js";

const PLACEHOLDER_IMAGES = {
  nyonya: [
    kuihAssortment,
    nyonyaHeritageMeal,
    creamyChickenRice,
    cendolShake,
  ],
  kopitiam: [
    rotiCanai,
    claypotNoodle,
    creamyChickenRice,
    cendolShake,
    healthyCafeBowl,
  ],
  dessert: [
    cendolShake,
    coconutShakeStall,
    kuihAssortment,
    healthyCafeBowl,
    rotiCanai,
  ],
  streetfood: [
    ikanBakar,
    rotiCanai,
    claypotNoodle,
    kuihAssortment,
    cendolShake,
    creamyChickenRice,
    fusionGreenPlate,
    nyonyaHeritageMeal,
    coconutShakeStall,
  ],
};

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function photoKeyOf(vendor) {
  const text = `${vendor.name || ""} ${vendor.signature_dishes || ""} ${vendor.ai_review_summary || ""}`.toLowerCase();
  if (text.includes("cendol") || text.includes("gula melaka") || text.includes("coconut shake")) return "dessert";
  if (text.includes("kuih") || text.includes("nyonya") || text.includes("peranakan") || text.includes("baba")) return "nyonya";
  if (text.includes("roti") || text.includes("kopitiam") || text.includes("toast") || text.includes("breakfast")) return "kopitiam";
  if (text.includes("kombucha") || text.includes("healthy") || text.includes("carrot cake") || text.includes("salad")) return "kopitiam";
  if (text.includes("duck kabocha") || text.includes("whole chicken leg") || text.includes("creamy korin")) return "nyonya";
  if (text.includes("claypot") || text.includes("noodle") || text.includes("mee") || text.includes("char kway") || text.includes("laksa") || text.includes("nasi") || text.includes("ikan") || text.includes("satay")) {
    return "streetfood";
  }
  return categoryOf(vendor);
}

// Deterministic (not random) so the same vendor always shows the same photo
// across renders/reloads, and prefers a real image_url the moment one exists.
export function placeholderImage(vendor) {
  if (vendor.image_url) return vendor.image_url;
  if (VENDOR_FOOD_IMAGES[vendor.id]) return VENDOR_FOOD_IMAGES[vendor.id];
  const pool = PLACEHOLDER_IMAGES[photoKeyOf(vendor)] || PLACEHOLDER_IMAGES.streetfood;
  return pool[hashStr(`${vendor.id || ""}:${vendor.name || ""}`) % pool.length];
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
