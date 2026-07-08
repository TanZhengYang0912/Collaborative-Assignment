import { Router } from "express";
import express from "express";
import { supabase } from "../supabase.js";
const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// VENDORS MODULE — Toh Lian Thing
// Add vendor-related routes here (list vendors, vendor details, etc.)
// ─────────────────────────────────────────────────────────────────────────────

// One-time Supabase setup (SQL editor + Storage):
//   alter table vendors add column if not exists status text not null default 'draft';
//   alter table vendors add column if not exists phone text;
//   alter table vendors add column if not exists storefront_image_url text;
//   -- Storage: create a PUBLIC bucket named "vendor-images"
//   -- (uploads go through this server with the service key, so no extra
//   --  storage policies are needed beyond public read).
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_BUCKET = "vendor-images";
const VENDOR_STATUSES = ["draft", "active", "suspended"];

const MELAKA_BOUNDS = { latMin: 1.8, latMax: 2.6, lngMin: 101.8, lngMax: 102.8 };

const HOURS_RE = /(\d{1,2}([:.]\d{2})?\s*(am|pm))|(\d{1,2}[:.]\d{2})|(24\s*hours?)/i;

function validateVendor(body = {}) {
  const errors = {};
  const clean = {};

  const str = (v) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim());

  // Business name
  const name = str(body.vendor_name);
  if (!name) errors.vendor_name = "Business name is required";
  else if (name.length < 2 || name.length > 120) errors.vendor_name = "Business name must be 2–120 characters";
  else clean.vendor_name = name;

  // Address
  const address = str(body.address);
  if (!address) errors.address = "Address is required";
  else clean.address = address;

  // Coordinates
  const lat = parseFloat(body.latitude);
  const lng = parseFloat(body.longitude);
  if (body.latitude == null || body.latitude === "" || Number.isNaN(lat)) {
    errors.latitude = "Latitude is required and must be a number";
  } else if (lat < -90 || lat > 90) {
    errors.latitude = "Latitude must be between -90 and 90";
  } else if (lat < MELAKA_BOUNDS.latMin || lat > MELAKA_BOUNDS.latMax) {
    errors.latitude = `Latitude looks outside Melaka (expected ${MELAKA_BOUNDS.latMin}–${MELAKA_BOUNDS.latMax})`;
  } else {
    clean.latitude = lat;
  }
  if (body.longitude == null || body.longitude === "" || Number.isNaN(lng)) {
    errors.longitude = "Longitude is required and must be a number";
  } else if (lng < -180 || lng > 180) {
    errors.longitude = "Longitude must be between -180 and 180";
  } else if (lng < MELAKA_BOUNDS.lngMin || lng > MELAKA_BOUNDS.lngMax) {
    errors.longitude = `Longitude looks outside Melaka (expected ${MELAKA_BOUNDS.lngMin}–${MELAKA_BOUNDS.lngMax})`;
  } else {
    clean.longitude = lng;
  }
  if (clean.latitude != null && clean.longitude != null) {
    clean.location = `SRID=4326;POINT(${clean.longitude} ${clean.latitude})`;
    clean.location_precision = "exact";
  }

  // Cuisine categories
  const cuisineRaw = Array.isArray(body.cuisine_types)
    ? body.cuisine_types.join(", ")
    : str(body.cuisine_types);
  if (!cuisineRaw) errors.cuisine_types = "At least one cuisine type is required";
  else clean.cuisine_types = cuisineRaw;

  // Operating hours
  const hours = str(body.operating_hours_raw);
  if (!hours) errors.operating_hours_raw = "Operating hours are required";
  else if (!HOURS_RE.test(hours)) errors.operating_hours_raw = 'Include a recognisable time, e.g. "Mon–Sun 9:00am – 10:00pm"';
  else clean.operating_hours_raw = hours;

  // Contact number (required, Malaysian format)
  const phone = str(body.phone);
  if (!phone) {
    errors.phone = "Contact number is required";
  } else if (!/^(\+?60|0)\d{8,10}$/.test(phone.replace(/[\s-]/g, ""))) {
    errors.phone = "Enter a valid Malaysian phone number, e.g. 06-283 1234 or +60 12-345 6789";
  } else {
    clean.phone = phone;
  }

  // Visibility status
  const status = str(body.status).toLowerCase() || "draft";
  if (!VENDOR_STATUSES.includes(status)) {
    errors.status = `Status must be one of: ${VENDOR_STATUSES.join(", ")}`;
  } else {
    clean.status = status;
  }

  // Remaining fields
  clean.state = str(body.state) || "Melaka";
  const priceRange = str(body.price_range);
  if (!priceRange) errors.price_range = "Price range is required";
  else clean.price_range = priceRange;
  const dishes = str(body.signature_dishes);
  if (!dishes) errors.signature_dishes = "Signature dishes are required";
  else clean.signature_dishes = dishes;

  return { errors, clean };
}

const sanitizeTerm = (t) => String(t).replace(/[,()]/g, " ").trim();

router.get("/vendors", async (req, res) => {
  const { q, cuisine, location, hours, status } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const from = (page - 1) * limit;

  let query = supabase
    .from("vendors")
    .select(
      "id, vendor_name, address, state, latitude, longitude, cuisine_types, operating_hours_raw, price_range, phone, status, storefront_image_url, average_rating, review_count",
      { count: "exact" }
    );

  if (q) query = query.ilike("vendor_name", `%${sanitizeTerm(q)}%`);
  if (cuisine) query = query.ilike("cuisine_types", `%${sanitizeTerm(cuisine)}%`);
  if (hours) query = query.ilike("operating_hours_raw", `%${sanitizeTerm(hours)}%`);
  if (status && VENDOR_STATUSES.includes(String(status).toLowerCase())) {
    query = query.eq("status", String(status).toLowerCase());
  }
  if (location) {
    const term = sanitizeTerm(location);
    query = query.or(`address.ilike.%${term}%,state.ilike.%${term}%`);
  }

  const { data, error, count } = await query
    .order("vendor_name", { ascending: true })
    .range(from, from + limit - 1);

  if (error) {
    return res.status(500).json({ error: "database query failed", details: error.message });
  }
  res.json({ vendors: data, total: count ?? 0, page, limit });
});

router.get("/vendors/meta", async (_req, res) => {
  const { data, error } = await supabase
    .from("vendors")
    .select("cuisine_types, state, status");

  if (error) {
    return res.status(500).json({ error: "database query failed", details: error.message });
  }

  const cuisines = new Set();
  const states = new Set();
  const statusCounts = { draft: 0, active: 0, suspended: 0 };
  for (const row of data) {
    (row.cuisine_types || "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
      .forEach((c) => cuisines.add(c));
    if (row.state) states.add(row.state.trim());
    const s = (row.status || "draft").toLowerCase();
    if (s in statusCounts) statusCounts[s]++;
  }

  res.json({
    cuisines: [...cuisines].sort((a, b) => a.localeCompare(b)),
    states: [...states].sort((a, b) => a.localeCompare(b)),
    statusCounts,
    total: data.length,
  });
});

router.get("/vendors/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error) return res.status(404).json({ error: "vendor not found", details: error.message });
  res.json(data);
});

router.post("/vendors", async (req, res) => {
  const { errors, clean } = validateVendor(req.body);
  if (Object.keys(errors).length) {
    return res.status(400).json({ error: "validation failed", fields: errors });
  }

  const { data, error } = await supabase
    .from("vendors")
    .insert(clean)
    .select()
    .single();

  if (error) {
    const status = error.code === "23505" ? 409 : 500; // unique violation → conflict
    return res.status(status).json({ error: "database insert failed", details: error.message });
  }
  res.status(201).json(data);
});

router.put("/vendors/:id", async (req, res) => {
  const { errors, clean } = validateVendor(req.body);
  if (Object.keys(errors).length) {
    return res.status(400).json({ error: "validation failed", fields: errors });
  }

  const { data, error } = await supabase
    .from("vendors")
    .update(clean)
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: "database update failed", details: error.message });
  }
  if (!data) return res.status(404).json({ error: "vendor not found" });
  res.json(data);
});

router.patch("/vendors/:id/status", async (req, res) => {
  const status = String(req.body?.status || "").toLowerCase();
  if (!VENDOR_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VENDOR_STATUSES.join(", ")}` });
  }

  const { data, error } = await supabase
    .from("vendors")
    .update({ status })
    .eq("id", req.params.id)
    .select("id, vendor_name, status")
    .single();

  if (error) {
    return res.status(500).json({ error: "database update failed", details: error.message });
  }
  res.json(data);
});

const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

router.post(
  "/vendors/:id/image",
  express.raw({ type: "image/*", limit: "8mb" }),
  async (req, res) => {
    const ext = ALLOWED_IMAGE_TYPES[req.headers["content-type"]];
    if (!ext) {
      return res.status(400).json({ error: "unsupported image type — use JPEG, PNG, WebP or GIF" });
    }
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ error: "empty upload — send the raw image as the request body" });
    }

    const { data: vendor, error: findErr } = await supabase
      .from("vendors")
      .select("id, storefront_image_url")
      .eq("id", req.params.id)
      .single();
    if (findErr || !vendor) return res.status(404).json({ error: "vendor not found" });

    const filePath = `vendors/${vendor.id}/storefront-${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, req.body, {
        contentType: req.headers["content-type"],
        cacheControl: "31536000", 
        upsert: false,
      });
    if (uploadErr) {
      return res.status(500).json({ error: "storage upload failed", details: uploadErr.message });
    }

    const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
    const publicUrl = pub.publicUrl;

    const { error: updateErr } = await supabase
      .from("vendors")
      .update({ storefront_image_url: publicUrl })
      .eq("id", vendor.id);
    if (updateErr) {
      return res.status(500).json({ error: "database update failed", details: updateErr.message });
    }

    const oldPath = storagePathFromUrl(vendor.storefront_image_url);
    if (oldPath && oldPath !== filePath) {
      await supabase.storage.from(STORAGE_BUCKET).remove([oldPath]);
    }

    res.status(201).json({ storefront_image_url: publicUrl });
  }
);

router.delete("/vendors/:id", async (req, res) => {
  const { data: vendor, error: findErr } = await supabase
    .from("vendors")
    .select("id, storefront_image_url")
    .eq("id", req.params.id)
    .single();
  if (findErr || !vendor) return res.status(404).json({ error: "vendor not found" });

  const { error } = await supabase.from("vendors").delete().eq("id", req.params.id);
  if (error) {
    return res.status(500).json({ error: "database delete failed", details: error.message });
  }

  const imagePath = storagePathFromUrl(vendor.storefront_image_url);
  if (imagePath) {
    await supabase.storage.from(STORAGE_BUCKET).remove([imagePath]);
  }

  res.json({ deleted: true, id: vendor.id });
});

function storagePathFromUrl(url) {
  if (!url) return null;
  const marker = `/object/public/${STORAGE_BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : decodeURIComponent(url.slice(idx + marker.length));
}

export default router;