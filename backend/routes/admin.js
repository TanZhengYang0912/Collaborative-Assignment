import { Router } from "express";
import { supabase } from "../supabase.js";
import fs from "node:fs";
import path from "node:path";
import { recomputeVendorRating } from "./engagement.js";
import {
  STORAGE_BUCKET,
  VENDOR_STATUSES,
  validateVendor,
  validateVendorPatch,
  storagePathFromUrl,
} from "../lib/vendorValidation.js";

const router = Router();

const OUTPUTS_DIR = path.resolve(process.cwd(), "outputs");

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN DASHBOARD / VENDORS / AI PROCESSING / SETTINGS / REVIEWS
// The whole /api/admin router is gated by requireRole("admin") in server.js,
// so every handler below can assume the caller is a verified admin.
// ─────────────────────────────────────────────────────────────────────────────

function normalizeStatusFilter(status) {
  if (!status || status === "all") return null;
  if (!VENDOR_STATUSES.includes(status)) return null;
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

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function dateKey(date) {
  return startOfDay(date).toISOString().slice(0, 10);
}

function makeTrend(days = 30) {
  const trend = [];
  const today = startOfDay(new Date());
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    trend.push({
      date: dateKey(date),
      label: date.toLocaleDateString("en-MY", { day: "numeric", month: "short" }),
      value: 0,
      active: 0,
      draft: 0,
    });
  }
  return trend;
}

function splitValues(value) {
  if (Array.isArray(value)) return value;
  return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
}

function buildDashboardAnalytics(vendors, reviews) {
  const trend = makeTrend(90);
  const trendByDate = new Map(trend.map((item) => [item.date, item]));
  const statusCounts = new Map([["active", 0], ["draft", 0], ["suspended", 0]]);
  const categoryCounts = new Map();
  const sourceCounts = new Map();

  for (const vendor of vendors) {
    const status = String(vendor.status || "draft").toLowerCase();
    statusCounts.set(status, (statusCounts.get(status) || 0) + 1);

    const createdDate = vendor.created_at && trendByDate.get(dateKey(vendor.created_at));
    if (createdDate) {
      createdDate.value += 1;
      if (status === "active") createdDate.active += 1;
      if (status === "draft") createdDate.draft += 1;
    }

    const categories = splitValues(vendor.cuisine_types);
    if (categories.length === 0) {
      categoryCounts.set("Uncategorized", (categoryCounts.get("Uncategorized") || 0) + 1);
    } else {
      categories.slice(0, 2).forEach((category) => {
        categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
      });
    }

    if (vendor.source_video_url) {
      const source = platformBadge(vendor.source_video_url, vendor.source_platform);
      sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
    }
  }

  const hiddenReviews = reviews.filter((review) => review.is_hidden).length;
  const draftVendors = statusCounts.get("draft") || 0;
  const missingAddress = vendors.filter((vendor) => !vendor.address || !vendor.city).length;
  const missingHours = vendors.filter((vendor) => !vendor.operating_hours_raw).length;
  const aiImported = vendors.filter((vendor) => vendor.source_video_url).length;
  const aiDrafts = vendors.filter((vendor) => vendor.source_video_url && String(vendor.status || "").toLowerCase() === "draft").length;

  const toBreakdown = (map, limit = 6) => [...map.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));

  const attentionItems = [
    { id: "drafts", label: "Draft vendors waiting for approval", value: draftVendors, href: "/admin/vendors2", tone: "warning" },
    { id: "missing-address", label: "Vendors missing verified location", value: missingAddress, href: "/admin/vendors2", tone: "warning" },
    { id: "missing-hours", label: "Vendors missing operating hours", value: missingHours, href: "/admin/vendors2", tone: "neutral" },
    { id: "hidden-reviews", label: "Hidden reviews to revisit", value: hiddenReviews, href: "/admin/reviews", tone: "danger" },
  ].filter((item) => item.value > 0);

  return {
    kpis: [
      { key: "totalVendors", label: "Total vendors", value: vendors.length, note: `${statusCounts.get("active") || 0} active`, href: "/admin/vendors2", tone: "neutral" },
      { key: "activeRate", label: "Active rate", value: vendors.length ? Math.round(((statusCounts.get("active") || 0) / vendors.length) * 100) : 0, suffix: "%", note: "of all vendor records", href: "/admin/vendors2?status=active", tone: "success" },
      { key: "pendingDrafts", label: "Pending drafts", value: draftVendors, note: "awaiting approval", href: "/admin/vendors2?status=draft", tone: "warning" },
      { key: "aiImported", label: "AI imported", value: aiImported, note: `${aiDrafts} still in draft`, href: "/admin/ai", tone: "accent" },
      { key: "reviews", label: "Reviews", value: reviews.length, note: `${hiddenReviews} hidden`, href: "/admin/reviews", tone: "neutral" },
    ],
    vendorTrend: trend,
    statusBreakdown: [
      { label: "Active", value: statusCounts.get("active") || 0, tone: "success" },
      { label: "Draft", value: statusCounts.get("draft") || 0, tone: "warning" },
      { label: "Suspended", value: statusCounts.get("suspended") || 0, tone: "danger" },
    ],
    categoryBreakdown: toBreakdown(categoryCounts),
    sourceBreakdown: toBreakdown(sourceCounts, 4),
    aiPipeline: [
      { label: "AI imported", value: aiImported, tone: "accent" },
      { label: "Needs review", value: aiDrafts, tone: "warning" },
      { label: "Active", value: vendors.filter((vendor) => vendor.source_video_url && String(vendor.status || "").toLowerCase() === "active").length, tone: "success" },
      { label: "Needs data", value: vendors.filter((vendor) => vendor.source_video_url && (!vendor.address || !vendor.operating_hours_raw)).length, tone: "danger" },
    ],
    attentionItems,
  };
}

router.get("/dashboard", async (_req, res) => {
  try {
    const [totalVendors, activeVendors, pendingReview, aiVideosProcessed, recentVendorsRes, recentLogRes, analyticsVendorsRes, analyticsReviewsRes] =
      await Promise.all([
        countQuery(supabase.from("vendors").select("id", { count: "exact", head: true })),
        countQuery(supabase.from("vendors").select("id", { count: "exact", head: true }).eq("status", "active")),
        countQuery(supabase.from("vendors").select("id", { count: "exact", head: true }).eq("status", "draft")),
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
        supabase
          .from("vendors")
          .select("id,vendor_name,cuisine_types,address,city,state,status,source_video_url,source_platform,operating_hours_raw,created_at,last_updated")
          .limit(5000),
        supabase
          .from("reviews")
          .select("id,is_hidden,created_at")
          .limit(5000),
      ]);

    if (recentVendorsRes.error) throw recentVendorsRes.error;
    if (recentLogRes.error) throw recentLogRes.error;

    const analytics = buildDashboardAnalytics(
      analyticsVendorsRes.error ? [] : (analyticsVendorsRes.data || []),
      analyticsReviewsRes.error ? [] : (analyticsReviewsRes.data || []),
    );

    const stats = [
      { label: "Total Vendors", value: totalVendors, note: "Records in Supabase", tone: "neutral" },
      { label: "Active Vendors", value: activeVendors, note: `${totalVendors ? Math.round((activeVendors / totalVendors) * 100) : 0}% activation`, tone: "success" },
      { label: "Pending Review", value: pendingReview, note: "Drafts awaiting approval", tone: "warning" },
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

    res.json({
      stats,
      recentVendors,
      recentProcessing,
      ...analytics,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load admin dashboard", details: error.message });
  }
});

const ADMIN_CATEGORIES = ["Malaysian / Local", "Nyonya / Peranakan", "Chinese", "Cafe / Dessert", "Western"];

router.get("/vendors", async (req, res) => {
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
        "id,vendor_name,address,state,latitude,longitude,status,cuisine_types,signature_dishes,source_platform,source_video_url,sentiment_score,created_at,last_updated,phone,price_range,operating_hours,operating_hours_raw,location_precision,storefront_image_url",
        { count: "exact" }
      )
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (sort === "az") {
      builder = builder.order("vendor_name", { ascending: true });
    } else if (sort === "za") {
      builder = builder.order("vendor_name", { ascending: false });
    } else if (sort === "oldest") {
      builder = builder.order("created_at", { ascending: true, nullsFirst: false });
    } else if (sort === "score_desc") {
      builder = builder.order("sentiment_score", { ascending: false, nullsFirst: false });
    } else if (sort === "score_asc") {
      builder = builder.order("sentiment_score", { ascending: true, nullsFirst: false });
    } else if (sort === "status") {
      builder = builder.order("status", { ascending: true, nullsFirst: false });
    } else if (sort === "status_desc") {
      builder = builder.order("status", { ascending: false, nullsFirst: false });
    } else if (sort === "cat_az") {
      builder = builder.order("cuisine_types", { ascending: true, nullsFirst: false });
    } else if (sort === "cat_za") {
      builder = builder.order("cuisine_types", { ascending: false, nullsFirst: false });
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
      imageUrl: vendor.storefront_image_url || null,
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

router.patch("/vendors/:id", async (req, res) => {
  const { id } = req.params;

  const { errors, clean } = validateVendorPatch(req.body || {});
  if (Object.keys(errors).length) {
    return res.status(400).json({ error: "Validation failed", fields: errors });
  }

  const patch = { ...clean, last_updated: new Date().toISOString() };
  // Write both hour columns — operating_hours previously went stale because
  // only operating_hours_raw was updated here while the GET preferred
  // operating_hours.
  if (clean.operating_hours_raw != null) patch.operating_hours = clean.operating_hours_raw;

  try {
    const { data, error } = await supabase
      .from("vendors")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      // PGRST116 = "no rows" from .single() — the id doesn't exist.
      if (error.code === "PGRST116") return res.status(404).json({ error: "Vendor not found" });
      throw error;
    }
    res.json(data);
  } catch (error) {
    console.error("PATCH /vendors/:id failed:", error);
    res.status(500).json({ error: "Failed to update vendor" });
  }
});

router.get("/ai-records", async (req, res) => {
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

router.post("/ai/submit", async (req, res) => {
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

router.get("/ai/service-status", async (_req, res) => {
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

router.get("/settings", async (_req, res) => {
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

router.post("/vendors", async (req, res) => {
  const { errors, clean } = validateVendor(req.body || {});
  if (Object.keys(errors).length) {
    return res.status(400).json({ error: "Validation failed", fields: errors });
  }

  try {
    const now = new Date().toISOString();
    const record = {
      ...clean,
      // GET prefers operating_hours; keep it in sync with the raw value.
      operating_hours: clean.operating_hours_raw,
      created_at: now,
      last_updated: now,
    };

    const { data, error } = await supabase
      .from("vendors")
      .insert(record)
      .select("*")
      .single();

    if (error) {
      const status = error.code === "23505" ? 409 : 500; // unique violation → conflict
      if (status === 409) return res.status(409).json({ error: "A vendor with these details already exists" });
      throw error;
    }
    res.status(201).json(data);
  } catch (error) {
    console.error("POST /vendors failed:", error);
    res.status(500).json({ error: "Failed to create vendor" });
  }
});

const REVIEW_PHOTO_BUCKET = "review-photos";

// Extract the object path for an arbitrary public bucket URL (the shared
// storagePathFromUrl is hardcoded to the vendor-images bucket).
function pathFromUrl(bucket, url) {
  if (!url) return null;
  const marker = `/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : decodeURIComponent(url.slice(idx + marker.length));
}

router.delete("/vendors/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // 404 up front, and grab the storefront image so we can clean it up after.
    const { data: vendor, error: findErr } = await supabase
      .from("vendors")
      .select("id, storefront_image_url")
      .eq("id", id)
      .single();
    if (findErr?.code === "PGRST116" || !vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    if (findErr) throw findErr;

    // Clean up related records in FK-safe order (children first) so nothing is
    // orphaned regardless of whether the DB has ON DELETE CASCADE. The schema
    // isn't in-repo, so we do this explicitly in app code.
    const { data: reviews } = await supabase.from("reviews").select("id").eq("vendor_id", id);
    const reviewIds = (reviews || []).map((r) => r.id);

    if (reviewIds.length) {
      // Review photos: remove storage objects, then the rows.
      const { data: photos } = await supabase
        .from("review_photos").select("url").in("review_id", reviewIds);
      const photoPaths = (photos || []).map((p) => pathFromUrl(REVIEW_PHOTO_BUCKET, p.url)).filter(Boolean);
      if (photoPaths.length) await supabase.storage.from(REVIEW_PHOTO_BUCKET).remove(photoPaths);
      await supabase.from("review_photos").delete().in("review_id", reviewIds);
      await supabase.from("review_votes").delete().in("review_id", reviewIds);
    }

    await supabase.from("reviews").delete().eq("vendor_id", id);
    await supabase.from("bookmarks").delete().eq("vendor_id", id);

    const { error: delErr } = await supabase.from("vendors").delete().eq("id", id);
    if (delErr) throw delErr;

    // Best-effort removal of the storefront image (don't fail the request if the
    // storage object is already gone).
    const imagePath = storagePathFromUrl(vendor.storefront_image_url);
    if (imagePath) await supabase.storage.from(STORAGE_BUCKET).remove([imagePath]);

    res.json({ success: true, id });
  } catch (error) {
    console.error("DELETE /vendors/:id failed:", error);
    res.status(500).json({ error: "Failed to delete vendor" });
  }
});

router.get("/reviews", async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(50, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 10));
  const visibility = String(req.query.visibility || "all").toLowerCase();

  try {
    let builder = supabase
      .from("reviews")
      .select("id, rating, body, author_name, is_hidden, hidden_reason, created_at, vendor:vendors(id, vendor_name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (visibility === "hidden") builder = builder.eq("is_hidden", true);
    if (visibility === "visible") builder = builder.eq("is_hidden", false);

    const { data, error, count } = await builder;
    if (error) throw error;

    const items = (data || []).map((r) => ({
      id: r.id,
      rating: r.rating,
      body: r.body,
      authorName: r.author_name,
      isHidden: r.is_hidden,
      hiddenReason: r.hidden_reason,
      createdAt: r.created_at,
      vendorId: r.vendor?.id,
      vendorName: r.vendor?.vendor_name,
    }));

    res.json({
      items,
      pagination: { page, pageSize, total: count || 0, totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)) },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load reviews", details: error.message });
  }
});

router.patch("/reviews/:id/visibility", async (req, res) => {
  const { id } = req.params;
  const isHidden = Boolean(req.body?.is_hidden);

  try {
    const { data, error } = await supabase
      .from("reviews")
      .update({ is_hidden: isHidden, hidden_reason: isHidden ? "admin" : null })
      .eq("id", id)
      .select("id, vendor_id")
      .single();
    if (error) throw error;

    await recomputeVendorRating(data.vendor_id);
    res.json({ id: data.id, isHidden });
  } catch (error) {
    res.status(500).json({ error: "Failed to update review visibility", details: error.message });
  }
});

export default router;
