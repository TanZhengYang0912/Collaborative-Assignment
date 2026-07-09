import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const imageDir = path.join(repoRoot, "frontend/public/assets/vendor_food");
const generatedDir = path.join(repoRoot, "frontend/src/generated");
const manifestPath = path.join(generatedDir, "vendorFoodImages.js");
const promptsPath = path.join(generatedDir, "vendorFoodPrompts.json");

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in backend/.env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function compact(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function shortSummary(value) {
  const text = compact(value);
  return text.length > 520 ? `${text.slice(0, 520)}...` : text;
}

function promptForVendor(vendor) {
  const dishes = compact(vendor.signature_dishes);
  const summary = shortSummary(vendor.ai_review_summary);
  const cuisine = compact(vendor.cuisine_types) || "Malaysian local food";
  const subject = dishes || `${cuisine} food inspired by the vendor review`;

  return [
    "Use case: photorealistic-natural",
    "Asset type: vendor food photo for a local food discovery app",
    `Primary request: Create one realistic food photo for vendor \"${compact(vendor.vendor_name)}\" based on: ${subject}.`,
    `Review context: ${summary || "No detailed dish summary available; make a plausible Malaysian local food photo without inventing signage."}`,
    "Scene/backdrop: casual Malaysian restaurant or hawker table, natural local dining ambience, no visible brand signage.",
    `Subject: ${subject}.`,
    "Style/medium: photorealistic natural food photography, looks like a real phone or food discovery app photo, not glossy AI art.",
    "Composition/framing: square image, close three-quarter top-down angle, food fills most of the frame with slight imperfect real-life plating.",
    "Lighting/mood: warm natural daylight or soft indoor stall lighting, appetizing but realistic, soft shadows.",
    "Materials/textures: realistic sauces, fried edges, rice/noodle/gravy texture, ceramic or melamine plates where appropriate.",
    "Constraints: no people, no readable text, no logos, no watermark, no fake menu, no exaggerated steam, no surreal ingredients, avoid overly perfect symmetry.",
  ].join("\n");
}

async function fetchVendors() {
  const { data, error } = await supabase
    .from("vendors")
    .select("id,vendor_name,signature_dishes,ai_review_summary,cuisine_types,last_updated")
    .order("last_updated", { ascending: false, nullsFirst: false })
    .range(0, 999);

  if (error) throw error;
  return data || [];
}

async function existingImageIds() {
  await fs.mkdir(imageDir, { recursive: true });
  const entries = await fs.readdir(imageDir, { withFileTypes: true });
  const images = new Map();
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name);
    if (ext !== ".svg" && ext !== ".png") continue;
    const id = path.basename(entry.name, ext);
    const current = images.get(id);
    if (!current || ext === ".png") images.set(id, ext);
  }
  return images;
}

function manifestSource(images) {
  const entries = [...images]
    .sort()
    .map(([id, ext]) => `  "${id}": "/assets/vendor_food/${id}${ext}",`)
    .join("\n");

  return [
    "// Generated vendor food image manifest.",
    "// Run `npm --prefix backend run prepare:vendor-food-images` after adding images.",
    "export const VENDOR_FOOD_IMAGES = {",
    entries,
    "};",
    "",
  ].join("\n");
}

await fs.mkdir(generatedDir, { recursive: true });

const vendors = await fetchVendors();
const images = await existingImageIds();
const validImages = new Map(vendors.map((vendor) => [vendor.id, images.get(vendor.id)]).filter(([, ext]) => ext));
const promptRecords = vendors.map((vendor) => ({
  id: vendor.id,
  vendor_name: vendor.vendor_name,
  output_path: `frontend/public/assets/vendor_food/${vendor.id}${images.get(vendor.id) || ".png"}`,
  generated: images.has(vendor.id),
  prompt: promptForVendor(vendor),
}));

await fs.writeFile(manifestPath, manifestSource(validImages));
await fs.writeFile(promptsPath, `${JSON.stringify(promptRecords, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      vendors: vendors.length,
      generated: validImages.size,
      missing: vendors.length - validImages.size,
      manifest: path.relative(repoRoot, manifestPath),
      prompts: path.relative(repoRoot, promptsPath),
      imageDir: path.relative(repoRoot, imageDir),
    },
    null,
    2
  )
);
