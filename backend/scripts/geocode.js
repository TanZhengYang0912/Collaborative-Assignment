/**
 * Batch geocode Vendor_Melaka.csv → fill address + lat/lng → upsert into Supabase
 *
 * Usage:
 *   node scripts/geocode.js <path-to-csv>
 *   CSV_PATH=../data/Vendor_Melaka.csv node scripts/geocode.js
 *
 * Requirements:
 *   - backend/.env must have GOOGLE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY
 */

import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// ── Config ──────────────────────────────────────────────────────────────────────────────
const CSV_PATH   = process.env.CSV_PATH
  ? path.resolve(process.env.CSV_PATH)
  : process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve("C:/Users/tanzh/Desktop/Daniel/Tarumt Uni/Y3/Collab/Assignment/data/Vendor_Melaka.csv");
const DELAY_MS   = 120;   // ~8 req/s — well within Google's free-tier limit
const BATCH_SIZE = 50;    // upsert rows in batches of 50
const LOG_PATH   = path.resolve("scripts/geocode_log.json");

const GOOGLE_KEY  = process.env.GOOGLE_API_KEY;
const supabase    = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

if (!GOOGLE_KEY) { console.error("❌  GOOGLE_API_KEY missing in .env"); process.exit(1); }

// ── Helpers ──────────────────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function geocode(vendorName, address) {
  const query    = `${vendorName}, ${address}, Melaka, Malaysia`;
  const url      = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&region=MY&key=${GOOGLE_KEY}`;
  const res      = await fetch(url);
  const data     = await res.json();

  if (data.status !== "OK" || !data.results.length) return null;

  const result   = data.results[0];
  const loc      = result.geometry.location;

  const inMelaka = result.formatted_address.toLowerCase().includes("melaka") ||
                   result.formatted_address.toLowerCase().includes("malacca");

  if (!inMelaka) return null;

  return {
    formatted_address: result.formatted_address,
    latitude:  loc.lat,
    longitude: loc.lng,
  };
}

// ── Load / save progress log ────────────────────────────────────────────────────────────
function loadLog() {
  if (fs.existsSync(LOG_PATH)) return JSON.parse(fs.readFileSync(LOG_PATH, "utf8"));
  return { done: [] };
}
function saveLog(log) { fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2)); }

// ── Main ──────────────────────────────────────────────────────────────────────────────
async function main() {
  const csv  = fs.readFileSync(CSV_PATH, "utf8");
  const rows = parse(csv, { columns: true, skip_empty_lines: true, trim: true });

  console.log(`📄  Loaded ${rows.length} vendors from CSV`);

  const log       = loadLog();
  const doneSet   = new Set(log.done);
  const pending   = rows.filter(r => !doneSet.has(r.vendor_name));

  console.log(`⏭️   Already processed: ${doneSet.size} | Remaining: ${pending.length}`);

  const upsertBuf = [];
  let ok = 0, skipped = 0, failed = 0;

  for (let i = 0; i < pending.length; i++) {
    const row = pending[i];
    const name = row.vendor_name?.trim();
    const addr = row.address?.trim();

    if (!name) { skipped++; continue; }

    process.stdout.write(`[${i + 1}/${pending.length}] ${name} ... `);

    const geo = await geocode(name, addr || "");

    if (!geo) {
      console.log("⚠️  not found / outside Melaka");
      failed++;
    } else {
      console.log(`✅  ${geo.formatted_address}`);
      ok++;

      upsertBuf.push({
        vendor_name:           name,
        address:               geo.formatted_address,
        latitude:              geo.latitude,
        longitude:             geo.longitude,
        state:                 row.state?.trim()              || null,
        cuisine_types:         row.cuisine_types?.trim()      || null,
        signature_dishes:      row.signature_dishes?.trim()   || null,
        price_range:           row.price_range?.trim()        || null,
        average_rating:        row.average_rating             ? parseFloat(row.average_rating) : null,
        review_count:          row.review_count               ? parseInt(row.review_count)     : null,
        ai_review_summary:     row.ai_review_summary?.trim()  || null,
        operating_hours_raw:   row.operating_hours?.trim()    || null,
        source_video_url:      row.source_video_url?.trim()   || null,
        source_platform:       row.source_platform?.trim()    || null,
        sentiment_score:       row.sentiment_score            ? parseFloat(row.sentiment_score) : null,
      });
    }

    log.done.push(name);

    if (upsertBuf.length >= BATCH_SIZE) {
      await flushBatch(upsertBuf);
      upsertBuf.length = 0;
    }

    if ((i + 1) % 10 === 0) saveLog(log);

    await sleep(DELAY_MS);
  }

  if (upsertBuf.length) await flushBatch(upsertBuf);
  saveLog(log);

  console.log(`\n✅  Done — ok: ${ok} | skipped: ${skipped} | not found: ${failed}`);
}

async function flushBatch(rows) {
  const { error } = await supabase
    .from("vendors")
    .upsert(rows, { onConflict: "vendor_name" });

  if (error) console.error("❌  Supabase upsert error:", error.message);
  else console.log(`💾  Upserted ${rows.length} rows`);
}

main().catch(err => { console.error(err); process.exit(1); });
