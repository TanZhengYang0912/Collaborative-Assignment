import { Router } from "express";
import { supabase } from "../supabase.js";
import fs from "node:fs";
import path from "node:path";

const router = Router();

const OUTPUTS_DIR = path.resolve(process.cwd(), "outputs");

function normalizeStatusFilter(status) {
  if (!status || status === "all") return null;
  if (status === "pending") return ["pending", "draft"];
  return [status];
}

function buildVendorSearch(query) {
  const safe = query.replace(/[%(),]/g, " ").trim();
  return [
    `vendor_name.ilike.%${safe}%`,
    `cuisine_types.ilike.%${safe}%`,
    `signature_dishes.ilike.%${safe}%`,
    `address.ilike.%${safe}%`,
    `state.ilike.%${safe}%`,
  ].join(",");
}

function recommendationLabel(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return "Needs Review";
  if (n >= 4.5) return "Highly Recommended";
  if (n >= 3.8) return "Recommended";
  if (n >= 3) return "Mixed";
  return "Low Confidence";
}

function platformBadge(url, platform) {
  if (platform) return platform;
  const lower = (url || "").toLowerCase();
  if (lower.includes("tiktok")) return "TikTok";
  if (lower.includes("youtube") || lower.includes("youtu.be")) return "YouTube";
  return "Unknown";
}

function firstLocation(vendor) {
  if (vendor.city) return vendor.city;
  if (vendor.address) return vendor.address.split(",")[0];
  return vendor.state || "Unknown";
}

async function countQuery(builder) {
  const { count, error } = await builder;
  if (error) throw error;
  return count || 0;
}

router.get("/admin/dashboard", async (_req, res) => {
  try {
    const [totalVendors, activeVendors, pendingReview, aiVideosProcessed, recentVendorsRes, recentLogRes] =
      await Promise.all([
        countQuery(supabase.from("vendors").select("id", { count: "exact", head: true })),
        countQuery(supabase.from("vendors").select("id", { count: "exact", head: true }).eq("status", "active")),
        countQuery(supabase.from("vendors").select("id", { count: "exact", head: true }).in("status", ["pending", "draft"])),
        countQuery(supabase.from("vendors").select("id", { count: "exact", head: true }).not("source_video_url", "is", null)),
        supabase
          .from("vendors")
          .select("id,vendor_name,cuisine_types,address,state,status,created_at,last_updated")
          .order("last_updated", { ascending: false, nullsFirst: false })
          .limit(5),
        supabase
          .from("vendors")
          .select("id,vendor_name,source_video_url,source_platform,signature_dishes,ai_review_summary,sentiment_score,address,city,state,last_updated")
          .not("source_video_url", "is", null)
          .order("last_updated", { ascending: false, nullsFirst: false })
          .limit(5),
      ]);

    if (recentVendorsRes.error) throw recentVendorsRes.error;
    if (recentLogRes.error) throw recentLogRes.error;

    const stats = [
      { label: "Total Vendors", value: totalVendors, note: "Records in Supabase", tone: "neutral" },
      { label: "Active Vendors", value: activeVendors, note: `${totalVendors ? Math.round((activeVendors / totalVendors) * 100) : 0}% activation`, tone: "success" },
      { label: "Pending Review", value: pendingReview, note: "Draft or pending approval", tone: "warning" },
      { label: "AI Videos Processed", value: aiVideosProcessed, note: "Saved from AI pipeline", tone: "accent" },
    ];

    const recentVendors = (recentVendorsRes.data || []).map((vendor) => ({
      id: vendor.id,
      name: vendor.vendor_name,
      initials: (vendor.vendor_name || "?").trim().charAt(0).toUpperCase(),
      category: vendor.cuisine_types?.split(",")[0]?.trim() || "Uncategorized",
      location: firstLocation(vendor),
      status: (vendor.status || "draft").toUpperCase(),
    }));

    const recentProcessing = (recentLogRes.data || []).map((item) => ({
      id: item.id,
      title: item.ai_review_summary?.split(".")[0]?.trim() || item.vendor_name,
      vendor: item.vendor_name,
      platform: platformBadge(item.source_video_url, item.source_platform),
      recommendation: recommendationLabel(item.sentiment_score),
    }));

    res.json({ stats, recentVendors, recentProcessing });
  } catch (error) {
    res.status(500).json({ error: "Failed to load admin dashboard", details: error.message });
  }
});

const ADMIN_CATEGORIES = ["Malaysian / Local", "Nyonya / Peranakan", "Chinese", "Cafe / Dessert", "Western"];

router.get("/admin/vendors", async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(50, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 10));
  const status = String(req.query.status || "all").toLowerCase();
  const category = String(req.query.category || "all");
  const sort = String(req.query.sort || "default").toLowerCase();
  const query = String(req.query.q || "").trim();

  try {
    let builder = supabase
      .from("vendors")
      .select(
        "id,vendor_name,address,state,latitude,longitude,status,cuisine_types,signature_dishes,source_platform,source_video_url,sentiment_score,created_at,last_updated,phone,price_range,operating_hours,operating_hours_raw,location_precision",
        { count: "exact" }
      )
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (sort === "az") {
      builder = builder.order("vendor_name", { ascending: true });
    } else if (sort === "za") {
      builder = builder.order("vendor_name", { ascending: false });
    } else if (sort === "oldest") {
      builder = builder.order("created_at", { ascending: true, nullsFirst: false });
    } else {
      // "default" and "newest" are the same — newest-created first.
      builder = builder.order("created_at", { ascending: false, nullsFirst: false });
    }
    // Secondary sort by id — many rows share an identical created_at from
    // bulk AI-pipeline inserts (or the same name), and Postgres doesn't
    // guarantee stable order among ties without a deterministic tiebreaker
    // (rows would shuffle between page loads otherwise).
    builder = builder.order("id", { ascending: true });

    const statuses = normalizeStatusFilter(status);
    if (statuses?.length === 1) builder = builder.eq("status", statuses[0]);
    if (statuses?.length > 1) builder = builder.in("status", statuses);
    if (category !== "all" && ADMIN_CATEGORIES.includes(category)) builder = builder.eq("cuisine_types", category);
    if (query) builder = builder.or(buildVendorSearch(query));

    const { data, error, count } = await builder;
    if (error) throw error;

    const items = (data || []).map((vendor) => ({
      id: vendor.id,
      name: vendor.vendor_name,
      category: vendor.cuisine_types?.split(",")[0]?.trim() || "Uncategorized",
      location: firstLocation(vendor),
      state: vendor.state,
      latitude: vendor.latitude,
      longitude: vendor.longitude,
      fullAddress: vendor.address,
      status: (vendor.status || "draft").toUpperCase(),
      videos: vendor.source_video_url ? 1 : 0,
      aiScore: vendor.sentiment_score,
      joined: vendor.created_at?.slice(0, 10) || null,
      sourcePlatform: platformBadge(vendor.source_video_url, vendor.source_platform),
      dishes: vendor.signature_dishes?.split(",").map((value) => value.trim()).filter(Boolean) || [],
      priceRange: vendor.price_range,
      phone: vendor.phone,
      operatingHours: vendor.operating_hours_raw || vendor.operating_hours,
      locationPrecision: vendor.location_precision,
    }));

    res.json({
      items,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load vendors", details: error.message });
  }
});

router.patch("/admin/vendors/:id", async (req, res) => {
  const { id } = req.params;
  const {
    vendor_name, address, state, status, cuisine_types, signature_dishes,
    price_range, phone, latitude, longitude, operating_hours_raw,
  } = req.body || {};

  try {
    const patch = {};
    if (vendor_name != null) patch.vendor_name = vendor_name;
    if (address != null) patch.address = address;
    if (state != null) patch.state = state;
    if (status != null) patch.status = status.toLowerCase();
    if (cuisine_types != null) patch.cuisine_types = cuisine_types;
    if (signature_dishes != null) patch.signature_dishes = signature_dishes;
    if (price_range != null) patch.price_range = price_range;
    if (phone != null) patch.phone = phone;
    if (latitude != null && latitude !== "") patch.latitude = Number.parseFloat(latitude);
    if (longitude != null && longitude !== "") patch.longitude = Number.parseFloat(longitude);
    if (operating_hours_raw != null) {
      // Write both hour columns — operating_hours previously went stale
      // because only operating_hours_raw was updated here while the GET
      // preferred operating_hours.
      patch.operating_hours_raw = operating_hours_raw;
      patch.operating_hours = operating_hours_raw;
    }
    patch.last_updated = new Date().toISOString();

    const { data, error } = await supabase
      .from("vendors")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to update vendor", details: error.message });
  }
});

router.get("/admin/ai-records", async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(50, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 5));

  try {
    const { data, error, count } = await supabase
      .from("vendors")
      .select(
        "id,vendor_name,address,city,state,source_platform,source_video_url,signature_dishes,ai_review_summary,sentiment_score,last_updated,price_range,status",
        { count: "exact" }
      )
      .not("source_video_url", "is", null)
      .order("last_updated", { ascending: false, nullsFirst: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) throw error;

    const items = (data || []).map((item) => ({
      id: item.id,
      title: item.ai_review_summary?.split(".")[0]?.trim() || item.vendor_name,
      vendor: item.vendor_name,
      platform: platformBadge(item.source_video_url, item.source_platform),
      location: item.city || firstLocation(item),
      dishes: item.signature_dishes?.split(",").map((value) => value.trim()).filter(Boolean) || [],
      recommendation: recommendationLabel(item.sentiment_score),
      score: item.sentiment_score,
      status: (item.status || "draft").toUpperCase(),
      sourceVideoUrl: item.source_video_url,
      summary: item.ai_review_summary,
      priceRange: item.price_range,
      lastUpdated: item.last_updated,
    }));

    res.json({
      items,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load AI processing records", details: error.message });
  }
});

router.post("/admin/ai/submit", async (req, res) => {
  const url = String(req.body?.url || "").trim();

  if (!url) {
    return res.status(400).json({ error: "A TikTok or YouTube URL is required" });
  }

  try {
    const target = `${process.env.AI_SERVICE_BASE || "http://localhost:8000"}/api/process`;
    const response = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      return res.status(response.status).json({
        error: payload?.detail || payload?.error || "Failed to submit AI processing job",
      });
    }

    return res.json(payload);
  } catch (error) {
    return res.status(502).json({
      error: "AI processing service is unavailable",
      details: error.message,
    });
  }
});

router.get("/admin/ai/service-status", async (_req, res) => {
  const base = process.env.AI_SERVICE_BASE || "http://localhost:8000";

  try {
    const response = await fetch(`${base}/openapi.json`);
    return res.json({
      available: response.ok,
      base,
      status: response.status,
    });
  } catch (error) {
    return res.json({
      available: false,
      base,
      error: error.message,
    });
  }
});

router.get("/admin/settings", async (_req, res) => {
  try {
    const platformSettings = [
      { label: "Platform Name", value: "TrueBites" },
      { label: "Tagline", value: "Official Food Discovery Platform · Melaka Tourism" },
      { label: "Contact Email", value: "admin@truebites.my" },
    ];

    const aiSettings = [
      { label: "Whisper Model", value: "small" },
      { label: "LLM Model", value: "llama-3.1-8b-instant" },
      { label: "Max Batch Size", value: "1000 videos" },
      { label: "Auto-save to Database", value: "Enabled (manual review before save)" },
      { label: "Backend API", value: process.env.PORT ? `localhost:${process.env.PORT}` : "localhost:4000" },
    ];

    const recentJobs = [];
    if (fs.existsSync(OUTPUTS_DIR)) {
      const jobIds = fs.readdirSync(OUTPUTS_DIR).slice(-5);
      for (const jobId of jobIds) {
        const statusPath = path.join(OUTPUTS_DIR, jobId, "status.json");
        if (!fs.existsSync(statusPath)) continue;
        try {
          const content = JSON.parse(fs.readFileSync(statusPath, "utf-8"));
          recentJobs.push({
            id: content.job_id,
            status: content.status,
            platform: content.platform,
            createdAt: content.created_at,
          });
        } catch {
          // Ignore malformed local status files.
        }
      }
    }

    res.json({ platformSettings, aiSettings, recentJobs });
  } catch (error) {
    res.status(500).json({ error: "Failed to load settings", details: error.message });
  }
});

router.post("/admin/vendors", async (req, res) => {
  const {
    vendor_name, address, state, status, cuisine_types, signature_dishes,
    price_range, phone, latitude, longitude, operating_hours_raw,
  } = req.body || {};

  if (!vendor_name || !vendor_name.trim()) {
    return res.status(400).json({ error: "Vendor name is required" });
  }

  try {
    const now = new Date().toISOString();
    const record = {
      vendor_name: vendor_name.trim(),
      address: address?.trim() || null,
      state: state?.trim() || null,
      status: (status || "draft").toLowerCase(),
      cuisine_types: cuisine_types?.trim() || null,
      signature_dishes: signature_dishes?.trim() || null,
      price_range: price_range?.trim() || null,
      phone: phone?.trim() || null,
      latitude: latitude != null && latitude !== "" ? Number.parseFloat(latitude) : null,
      longitude: longitude != null && longitude !== "" ? Number.parseFloat(longitude) : null,
      operating_hours_raw: operating_hours_raw?.trim() || null,
      operating_hours: operating_hours_raw?.trim() || null,
      created_at: now,
      last_updated: now,
    };

    const { data, error } = await supabase
      .from("vendors")
      .insert(record)
      .select("*")
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to create vendor", details: error.message });
  }
});

router.delete("/admin/vendors/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from("vendors")
      .delete()
      .eq("id", id);

    if (error) throw error;
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete vendor", details: error.message });
  }
});

export default router;
