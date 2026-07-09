import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const sourceDir = path.join(repoRoot, "frontend/src/assets/vendor-food");
const imageDir = path.join(repoRoot, "frontend/public/assets/vendor_food");
const generatedDir = path.join(repoRoot, "frontend/src/generated");
const promptsPath = path.join(generatedDir, "vendorFoodPrompts.json");
const manifestPath = path.join(generatedDir, "vendorFoodImages.js");
const sourceManifestPath = path.join(generatedDir, "vendorFoodImageSources.js");

const options = parseArgs(process.argv.slice(2));

const SOURCE_IMAGES = [
  "01-ikan-bakar.png",
  "02-roti-canai.png",
  "03-kuih-assortment.png",
  "04-claypot-noodle.png",
  "05-cendol-coconut-shake.png",
  "06-creamy-chicken-rice-cake.png",
  "07-healthy-cafe-bowl.png",
  "08-fusion-green-plate.png",
  "09-nyonya-heritage-meal.png",
  "10-coconut-shake-stall.png",
];

function parseArgs(args) {
  const parsed = {
    force: false,
    limit: null,
    size: 1024,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    const next = () => args[++i];
    if (arg === "--force") parsed.force = true;
    else if (arg === "--limit") parsed.limit = Number(next());
    else if (arg === "--size") parsed.size = Number(next());
    else if (arg === "--help") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isInteger(parsed.size) || parsed.size < 256) {
    throw new Error("--size must be an integer >= 256");
  }
  if (parsed.limit != null && (!Number.isInteger(parsed.limit) || parsed.limit < 1)) {
    throw new Error("--limit must be a positive integer");
  }

  return parsed;
}

function printHelp() {
  console.log(`Generate zero-cost local vendor food image variants.

Usage:
  npm --prefix backend run generate:vendor-food-variants -- [options]

Options:
  --limit <n>   Generate at most n missing variants
  --size <px>   Output square size (default: 1024)
  --force       Regenerate existing variant files
`);
}

function hashStr(value) {
  let hash = 2166136261;
  const text = String(value || "");
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function textFor(record) {
  return `${record.vendor_name || ""} ${record.prompt || ""}`.toLowerCase();
}

function sourceCandidatesFor(record) {
  const text = textFor(record);
  const weighted = [];

  if (/(cendol|coconut|shake|dessert|sweet|ice|gula melaka)/.test(text)) weighted.push(4, 9, 2);
  if (/(nyonya|peranakan|kuih|heritage|baba|nonya)/.test(text)) weighted.push(2, 8, 5);
  if (/(roti|canai|kopitiam|toast|coffee|breakfast|bakery)/.test(text)) weighted.push(1, 3, 6);
  if (/(claypot|noodle|mee|laksa|wonton|wantan|char kway|char koay)/.test(text)) weighted.push(3, 7, 0);
  if (/(ikan|bakar|satay|nasi|rice|ayam|rendang|sotong|prawn|hawker)/.test(text)) weighted.push(0, 1, 3, 7);

  const pool = weighted.length > 0 ? weighted : SOURCE_IMAGES.map((_, index) => index);
  return [...new Set(pool)];
}

function assignSourceIndexes(records) {
  const assignments = new Map();
  const recent = [];
  const allIndexes = SOURCE_IMAGES.map((_, index) => index);

  records.forEach((record, position) => {
    const preferred = sourceCandidatesFor(record);
    const pool = [...new Set([...preferred, ...allIndexes])];
    const nonRecent = pool.filter((index) => !recent.includes(index));
    const choices = nonRecent.length > 0 ? nonRecent : pool;
    const h = hashStr(`${record.id}:${record.vendor_name || ""}:${position}`);
    const sourceIndex = choices[h % choices.length];

    assignments.set(record.id, sourceIndex);
    recent.push(sourceIndex);
    while (recent.length > 8) recent.shift();
  });

  return assignments;
}

async function imageSize(filePath) {
  const { stdout } = await execFileAsync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", filePath]);
  const width = Number(stdout.match(/pixelWidth:\s*(\d+)/)?.[1]);
  const height = Number(stdout.match(/pixelHeight:\s*(\d+)/)?.[1]);
  if (!width || !height) throw new Error(`Unable to read image size for ${filePath}`);
  return { width, height };
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function outputPathFor(record) {
  return path.join(imageDir, `${record.id}.png`);
}

function transformFor(record, sourceSize) {
  const h = hashStr(`${record.id}:${record.vendor_name || ""}`);
  const minSide = Math.min(sourceSize.width, sourceSize.height);
  const crop = Math.max(640, Math.floor(minSide * (0.72 + ((h % 18) / 100))));
  const maxX = Math.max(0, sourceSize.width - crop);
  const maxY = Math.max(0, sourceSize.height - crop);
  const offsetX = maxX === 0 ? 0 : (h >>> 8) % maxX;
  const offsetY = maxY === 0 ? 0 : (h >>> 17) % maxY;

  const flip = Boolean((h >>> 5) & 1);
  const brightness = 0.92 + (((h >>> 10) % 19) / 100);
  const saturation = 0.9 + (((h >>> 15) % 31) / 100);
  const contrast = 0.93 + (((h >>> 20) % 21) / 100);
  const hue = -7 + ((h >>> 25) % 15);
  const warmth = ((h >>> 2) % 2) === 0 ? "#c08b2c" : "#14335f";
  const warmthOpacity = 0.025 + ((h >>> 28) % 4) / 100;
  const vignetteOpacity = 0.1 + ((h >>> 7) % 8) / 100;

  return {
    brightness,
    contrast,
    crop,
    flip,
    hue,
    offsetX,
    offsetY,
    saturation,
    vignetteOpacity,
    warmth,
    warmthOpacity,
  };
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function generateVariant(record, sourcePath, sourceSize) {
  const finalPath = outputPathFor(record);
  const tempCropped = `${finalPath}.crop-${process.pid}.png`;
  const tempSized = `${finalPath}.sized-${process.pid}.png`;
  const tempFlipped = `${finalPath}.flipped-${process.pid}.png`;
  const transform = transformFor(record, sourceSize);

  await execFileAsync("sips", [
    "-c",
    String(transform.crop),
    String(transform.crop),
    "--cropOffset",
    String(transform.offsetY),
    String(transform.offsetX),
    sourcePath,
    "--out",
    tempCropped,
  ]);

  await execFileAsync("sips", [
    "-z",
    String(options.size),
    String(options.size),
    tempCropped,
    "--out",
    tempSized,
  ]);

  if (transform.flip) {
    await execFileAsync("sips", ["-f", "horizontal", tempSized, "--out", tempFlipped]);
    await fs.rename(tempFlipped, finalPath);
  } else {
    await fs.rename(tempSized, finalPath);
  }

  await Promise.allSettled([fs.unlink(tempCropped), fs.unlink(tempSized), fs.unlink(tempFlipped)]);
}

async function cleanupStaleTemps() {
  const entries = await fs.readdir(imageDir, { withFileTypes: true });
  await Promise.allSettled(
    entries
      .filter((entry) => entry.isFile() && /\.(png|svg)\.(crop|sized|flipped|rotated)-\d+\.png$/.test(entry.name))
      .map((entry) => fs.unlink(path.join(imageDir, entry.name)))
  );
}

function manifestSource(ids) {
  const entries = [...ids]
    .sort()
    .map((id) => `  "${id}": "/assets/vendor_food/${id}.png",`)
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

function sourceManifestSource(records, assignments) {
  const entries = records
    .map((record) => [record.id, SOURCE_IMAGES[assignments.get(record.id)]])
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, source]) => `  "${id}": "${source}",`)
    .join("\n");

  return [
    "// Generated vendor food source manifest.",
    "// Used only to spread visually similar cards apart in paginated grids.",
    "export const VENDOR_FOOD_SOURCE_KEYS = {",
    entries,
    "};",
    "",
  ].join("\n");
}

await fs.mkdir(imageDir, { recursive: true });
await fs.mkdir(generatedDir, { recursive: true });
await cleanupStaleTemps();

const records = JSON.parse(await fs.readFile(promptsPath, "utf8"));
const sourcePaths = SOURCE_IMAGES.map((name) => path.join(sourceDir, name));
const sourceSizes = await Promise.all(sourcePaths.map((sourcePath) => imageSize(sourcePath)));
const sourceAssignments = assignSourceIndexes(records);

for (const record of records) {
  record.generated = await fileExists(outputPathFor(record));
}

const targets = records
  .filter((record) => options.force || !record.generated)
  .slice(0, options.limit ?? records.length);

let generated = 0;
let skipped = 0;

for (const record of targets) {
  const finalPath = outputPathFor(record);
  if (!options.force && (await fileExists(finalPath))) {
    skipped += 1;
    continue;
  }

  const sourceIndex = sourceAssignments.get(record.id);
  await generateVariant(record, sourcePaths[sourceIndex], sourceSizes[sourceIndex]);
  record.generated = true;
  generated += 1;

  if (generated % 50 === 0 || generated === targets.length) {
    console.log(`generated ${generated}/${targets.length}`);
  }
}

for (const record of records) {
  record.generated = await fileExists(outputPathFor(record));
}

const generatedIds = new Set(records.filter((record) => record.generated).map((record) => record.id));
await fs.writeFile(manifestPath, manifestSource(generatedIds));
await fs.writeFile(sourceManifestPath, sourceManifestSource(records, sourceAssignments));
await fs.writeFile(promptsPath, `${JSON.stringify(records, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      totalPrompts: records.length,
      generatedThisRun: generated,
      skippedThisRun: skipped,
      generatedTotal: generatedIds.size,
      missingTotal: records.length - generatedIds.size,
      imageDir: path.relative(repoRoot, imageDir),
      manifest: path.relative(repoRoot, manifestPath),
      sourceManifest: path.relative(repoRoot, sourceManifestPath),
      cost: "0 API calls",
    },
    null,
    2
  )
);
