import { Router } from "express";
import express from "express";
import { Filter } from "bad-words";
import { supabase } from "../supabase.js";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// ENGAGEMENT & BOOKMARKING MODULE
//   Bookmarks (one folder per vendor) + reviews (star + text + photo, with
//   like/dislike) + admin moderation (see admin.js for the moderation routes).
//
// One-time Supabase setup (SQL editor + Storage):
//
//   create table if not exists bookmark_folders (
//     id uuid primary key default gen_random_uuid(),
//     user_id uuid not null references auth.users(id) on delete cascade,
//     name text not null,
//     is_default boolean not null default false,
//     created_at timestamptz not null default now(),
//     unique (user_id, name)
//   );
//   create table if not exists bookmarks (
//     id uuid primary key default gen_random_uuid(),
//     user_id uuid not null references auth.users(id) on delete cascade,
//     vendor_id uuid not null references vendors(id) on delete cascade,
//     folder_id uuid references bookmark_folders(id) on delete set null,
//     created_at timestamptz not null default now(),
//     unique (user_id, vendor_id)          -- one folder per vendor
//   );
//   create table if not exists reviews (
//     id uuid primary key default gen_random_uuid(),
//     user_id uuid not null references auth.users(id) on delete cascade,
//     vendor_id uuid not null references vendors(id) on delete cascade,
//     rating int not null check (rating between 1 and 5),
//     body text,
//     author_name text,
//     is_hidden boolean not null default false,
//     hidden_reason text,                  -- 'profanity' | 'admin'
//     created_at timestamptz not null default now(),
//     updated_at timestamptz not null default now(),
//     unique (user_id, vendor_id)          -- one review per user per vendor
//   );
//   create table if not exists review_photos (
//     id uuid primary key default gen_random_uuid(),
//     review_id uuid not null references reviews(id) on delete cascade,
//     url text not null
//   );
//   create table if not exists review_votes (
//     id uuid primary key default gen_random_uuid(),
//     review_id uuid not null references reviews(id) on delete cascade,
//     user_id uuid not null references auth.users(id) on delete cascade,
//     is_like boolean not null,
//     unique (review_id, user_id)          -- one vote per user per review
//   );
//   -- Storage: create a PUBLIC bucket named "review-photos"
//   -- (uploads go through this server with the service key, so no extra
//   --  storage policies are needed beyond public read).
// ─────────────────────────────────────────────────────────────────────────────

const REVIEW_PHOTO_BUCKET = "review-photos";
const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_PHOTOS_PER_REVIEW = 4;

const filter = new Filter();

// ponytail: TEMPORARY testing bypass — set ENGAGEMENT_TEST_MODE=true in
// backend/.env to skip real JWT verification everywhere below and act as a
// fixed pre-created test account (engagement-test@truebites.local). This
// removes the ownership trust boundary entirely — every caller becomes the
// same user. MUST be deleted (this block + the two `if (TEST_MODE)` branches
// below) before the engagement module ships; do not leave ENGAGEMENT_TEST_MODE
// set in any deployed environment.
const TEST_MODE = process.env.ENGAGEMENT_TEST_MODE === "true";
const TEST_USER = {
  id: "78c8682a-102e-4925-a2c1-71144f4aaace",
  email: "engagement-test@truebites.local",
  user_metadata: { full_name: "Engagement Test User" },
};

// The backend uses the Supabase service key for everything, so it trusts no
// caller by default. Ownership (who may edit/delete a review or bookmark)
// is a real trust boundary — the verified JWT subject is the only id ever
// used for a WHERE clause, never a client-supplied one.
async function requireUser(req, res) {
  if (TEST_MODE) return TEST_USER;

  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Sign in required" });
    return null;
  }
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    res.status(401).json({ error: "Invalid or expired session" });
    return null;
  }
  return data.user;
}

// Optional auth — public review reads stay open, but a signed-in caller
// should still see their own hidden review in the list.
async function optionalUser(req) {
  if (TEST_MODE) return TEST_USER;

  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  const { data } = await supabase.auth.getUser(token);
  return data?.user || null;
}

async function getOrCreateDefaultFolder(userId) {
  const { data: existing } = await supabase
    .from("bookmark_folders")
    .select("id")
    .eq("user_id", userId)
    .eq("is_default", true)
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("bookmark_folders")
    .insert({ user_id: userId, name: "Default", is_default: true })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function recomputeVendorRating(vendorId) {
  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("vendor_id", vendorId)
    .eq("is_hidden", false);
  if (error) throw error;

  const count = data.length;
  const average = count ? data.reduce((sum, r) => sum + r.rating, 0) / count : null;

  await supabase
    .from("vendors")
    .update({ average_rating: average, review_count: count })
    .eq("id", vendorId);
}

function storagePathFromUrl(url) {
  if (!url) return null;
  const marker = `/object/public/${REVIEW_PHOTO_BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : decodeURIComponent(url.slice(idx + marker.length));
}

// ── Folders ─────────────────────────────────────────────────────────────────

router.get("/engagement/folders", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const { data, error } = await supabase
    .from("bookmark_folders")
    .select("id, name, is_default, created_at")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) return res.status(500).json({ error: "database query failed", details: error.message });

  res.json({ folders: data });
});

router.post("/engagement/folders", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const name = String(req.body?.name || "").trim();
  if (!name) return res.status(400).json({ error: "Folder name is required" });

  const { data, error } = await supabase
    .from("bookmark_folders")
    .insert({ user_id: user.id, name, is_default: false })
    .select("id, name, is_default, created_at")
    .single();
  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    return res.status(status).json({ error: status === 409 ? "You already have a folder with that name" : "database insert failed", details: error.message });
  }

  res.status(201).json({ folder: data });
});

router.delete("/engagement/folders/:id", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const { data: folder, error: findErr } = await supabase
    .from("bookmark_folders")
    .select("id, is_default")
    .eq("id", req.params.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (findErr) return res.status(500).json({ error: "database query failed", details: findErr.message });
  if (!folder) return res.status(404).json({ error: "Folder not found" });
  if (folder.is_default) return res.status(400).json({ error: "Can't delete the Default folder" });

  const defaultId = await getOrCreateDefaultFolder(user.id);
  await supabase
    .from("bookmarks")
    .update({ folder_id: defaultId })
    .eq("user_id", user.id)
    .eq("folder_id", folder.id);

  const { error } = await supabase.from("bookmark_folders").delete().eq("id", folder.id);
  if (error) return res.status(500).json({ error: "database delete failed", details: error.message });

  res.json({ deleted: true, id: folder.id });
});

// ── Bookmarks ───────────────────────────────────────────────────────────────

const BOOKMARK_SELECT = `
  vendor_id, folder_id, created_at,
  folder:bookmark_folders(id, name, is_default),
  vendor:vendors(id, vendor_name, address, latitude, longitude, cuisine_types,
    signature_dishes, price_range, ai_review_summary, source_video_url,
    source_platform, average_rating, review_count)
`;

router.get("/engagement/bookmarks", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const { data, error } = await supabase
    .from("bookmarks")
    .select(BOOKMARK_SELECT)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "database query failed", details: error.message });

  res.json({
    bookmarks: (data || []).map((row) => ({
      ...row,
      vendor: row.vendor ? { ...row.vendor, id: row.vendor.id, name: row.vendor.vendor_name } : null,
    })),
  });
});

router.post("/engagement/bookmarks", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const vendorId = req.body?.vendor_id;
  if (!vendorId) return res.status(400).json({ error: "vendor_id is required" });

  let folderId = req.body?.folder_id || null;
  if (folderId) {
    const { data: folder } = await supabase
      .from("bookmark_folders")
      .select("id")
      .eq("id", folderId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!folder) return res.status(404).json({ error: "Folder not found" });
  } else {
    folderId = await getOrCreateDefaultFolder(user.id);
  }

  const { data, error } = await supabase
    .from("bookmarks")
    .upsert({ user_id: user.id, vendor_id: vendorId, folder_id: folderId }, { onConflict: "user_id,vendor_id" })
    .select("vendor_id, folder_id, created_at")
    .single();
  if (error) return res.status(500).json({ error: "database insert failed", details: error.message });

  res.status(201).json({ bookmark: data });
});

router.patch("/engagement/bookmarks/:vendorId", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  let folderId = req.body?.folder_id || null;
  folderId = folderId || (await getOrCreateDefaultFolder(user.id));

  const { data: folder } = await supabase
    .from("bookmark_folders")
    .select("id")
    .eq("id", folderId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!folder) return res.status(404).json({ error: "Folder not found" });

  const { data, error } = await supabase
    .from("bookmarks")
    .update({ folder_id: folderId })
    .eq("user_id", user.id)
    .eq("vendor_id", req.params.vendorId)
    .select("vendor_id, folder_id")
    .single();
  if (error) return res.status(500).json({ error: "database update failed", details: error.message });
  if (!data) return res.status(404).json({ error: "Bookmark not found" });

  res.json({ bookmark: data });
});

router.delete("/engagement/bookmarks/:vendorId", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("user_id", user.id)
    .eq("vendor_id", req.params.vendorId);
  if (error) return res.status(500).json({ error: "database delete failed", details: error.message });

  res.json({ deleted: true });
});

// ── Reviews ─────────────────────────────────────────────────────────────────

function displayName(user) {
  return user.user_metadata?.full_name || user.user_metadata?.name || user.email || "Anonymous";
}

router.get("/engagement/vendors/:vendorId/reviews", async (req, res) => {
  const caller = await optionalUser(req);

  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("id, user_id, rating, body, author_name, is_hidden, hidden_reason, created_at, updated_at, review_photos(id, url)")
    .eq("vendor_id", req.params.vendorId)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "database query failed", details: error.message });

  const visible = reviews.filter((r) => !r.is_hidden || r.user_id === caller?.id);
  const ids = visible.map((r) => r.id);

  const { data: votes } = ids.length
    ? await supabase.from("review_votes").select("review_id, user_id, is_like").in("review_id", ids)
    : { data: [] };

  const withVotes = visible.map((r) => {
    const reviewVotes = (votes || []).filter((v) => v.review_id === r.id);
    return {
      ...r,
      isOwn: r.user_id === caller?.id,
      likes: reviewVotes.filter((v) => v.is_like).length,
      dislikes: reviewVotes.filter((v) => !v.is_like).length,
      myVote: caller ? reviewVotes.find((v) => v.user_id === caller.id)?.is_like ?? null : null,
    };
  });

  res.json({ reviews: withVotes });
});

router.get("/engagement/reviews/mine", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const { data, error } = await supabase
    .from("reviews")
    .select("id, vendor_id, rating, body, is_hidden, hidden_reason, created_at, updated_at, review_photos(id, url), vendor:vendors(id, vendor_name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "database query failed", details: error.message });

  res.json({
    reviews: (data || []).map((r) => ({ ...r, vendor: r.vendor ? { id: r.vendor.id, name: r.vendor.vendor_name } : null })),
  });
});

router.post("/engagement/vendors/:vendorId/reviews", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const rating = Number.parseInt(req.body?.rating, 10);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "rating must be an integer 1-5" });
  }
  const body = String(req.body?.body || "").trim() || null;
  const profane = body ? filter.isProfane(body) : false;

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      user_id: user.id,
      vendor_id: req.params.vendorId,
      rating,
      body,
      author_name: displayName(user),
      is_hidden: profane,
      hidden_reason: profane ? "profanity" : null,
    })
    .select("id, rating, body, author_name, is_hidden, hidden_reason, created_at, updated_at")
    .single();
  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    return res.status(status).json({
      error: status === 409 ? "You've already reviewed this vendor — edit your existing review instead" : "database insert failed",
      details: error.message,
    });
  }

  if (!profane) await recomputeVendorRating(req.params.vendorId);
  res.status(201).json({ review: { ...data, isOwn: true, likes: 0, dislikes: 0, myVote: null } });
});

router.patch("/engagement/reviews/:id", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const { data: existing, error: findErr } = await supabase
    .from("reviews")
    .select("id, user_id, vendor_id")
    .eq("id", req.params.id)
    .maybeSingle();
  if (findErr) return res.status(500).json({ error: "database query failed", details: findErr.message });
  if (!existing) return res.status(404).json({ error: "Review not found" });
  if (existing.user_id !== user.id) return res.status(403).json({ error: "You can only edit your own review" });

  const patch = { updated_at: new Date().toISOString() };
  if (req.body?.rating != null) {
    const rating = Number.parseInt(req.body.rating, 10);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "rating must be an integer 1-5" });
    }
    patch.rating = rating;
  }
  if (req.body?.body != null) {
    const body = String(req.body.body).trim() || null;
    patch.body = body;
    const profane = body ? filter.isProfane(body) : false;
    patch.is_hidden = profane;
    patch.hidden_reason = profane ? "profanity" : null;
  }

  const { data, error } = await supabase
    .from("reviews")
    .update(patch)
    .eq("id", req.params.id)
    .select("id, rating, body, author_name, is_hidden, hidden_reason, created_at, updated_at")
    .single();
  if (error) return res.status(500).json({ error: "database update failed", details: error.message });

  await recomputeVendorRating(existing.vendor_id);
  res.json({ review: { ...data, isOwn: true } });
});

router.delete("/engagement/reviews/:id", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const { data: existing, error: findErr } = await supabase
    .from("reviews")
    .select("id, user_id, vendor_id")
    .eq("id", req.params.id)
    .maybeSingle();
  if (findErr) return res.status(500).json({ error: "database query failed", details: findErr.message });
  if (!existing) return res.status(404).json({ error: "Review not found" });
  if (existing.user_id !== user.id) return res.status(403).json({ error: "You can only delete your own review" });

  const { data: photos } = await supabase.from("review_photos").select("url").eq("review_id", existing.id);
  const { error } = await supabase.from("reviews").delete().eq("id", existing.id);
  if (error) return res.status(500).json({ error: "database delete failed", details: error.message });

  const paths = (photos || []).map((p) => storagePathFromUrl(p.url)).filter(Boolean);
  if (paths.length) await supabase.storage.from(REVIEW_PHOTO_BUCKET).remove(paths);

  await recomputeVendorRating(existing.vendor_id);
  res.json({ deleted: true, id: existing.id });
});

// ── Review photos ───────────────────────────────────────────────────────────

router.post(
  "/engagement/reviews/:id/photo",
  express.raw({ type: "image/*", limit: "8mb" }),
  async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;

    const ext = ALLOWED_IMAGE_TYPES[req.headers["content-type"]];
    if (!ext) return res.status(400).json({ error: "unsupported image type — use JPEG, PNG, WebP or GIF" });
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ error: "empty upload — send the raw image as the request body" });
    }

    const { data: review, error: findErr } = await supabase
      .from("reviews")
      .select("id, user_id")
      .eq("id", req.params.id)
      .maybeSingle();
    if (findErr) return res.status(500).json({ error: "database query failed", details: findErr.message });
    if (!review) return res.status(404).json({ error: "Review not found" });
    if (review.user_id !== user.id) return res.status(403).json({ error: "You can only add photos to your own review" });

    const { count } = await supabase
      .from("review_photos")
      .select("id", { count: "exact", head: true })
      .eq("review_id", review.id);
    if ((count || 0) >= MAX_PHOTOS_PER_REVIEW) {
      return res.status(400).json({ error: `A review can have at most ${MAX_PHOTOS_PER_REVIEW} photos` });
    }

    const filePath = `reviews/${review.id}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from(REVIEW_PHOTO_BUCKET)
      .upload(filePath, req.body, { contentType: req.headers["content-type"], cacheControl: "31536000", upsert: false });
    if (uploadErr) return res.status(500).json({ error: "storage upload failed", details: uploadErr.message });

    const { data: pub } = supabase.storage.from(REVIEW_PHOTO_BUCKET).getPublicUrl(filePath);

    const { data, error } = await supabase
      .from("review_photos")
      .insert({ review_id: review.id, url: pub.publicUrl })
      .select("id, url")
      .single();
    if (error) return res.status(500).json({ error: "database insert failed", details: error.message });

    res.status(201).json({ photo: data });
  }
);

// ── Votes ───────────────────────────────────────────────────────────────────

router.post("/engagement/reviews/:id/vote", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const isLike = req.body?.is_like;
  if (typeof isLike !== "boolean") return res.status(400).json({ error: "is_like must be a boolean" });

  const { data: review } = await supabase.from("reviews").select("id, user_id").eq("id", req.params.id).maybeSingle();
  if (!review) return res.status(404).json({ error: "Review not found" });
  if (review.user_id === user.id) return res.status(400).json({ error: "You can't vote on your own review" });

  const { error } = await supabase
    .from("review_votes")
    .upsert({ review_id: review.id, user_id: user.id, is_like: isLike }, { onConflict: "review_id,user_id" });
  if (error) return res.status(500).json({ error: "database insert failed", details: error.message });

  res.json({ voted: true });
});

router.delete("/engagement/reviews/:id/vote", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const { error } = await supabase
    .from("review_votes")
    .delete()
    .eq("review_id", req.params.id)
    .eq("user_id", user.id);
  if (error) return res.status(500).json({ error: "database delete failed", details: error.message });

  res.json({ deleted: true });
});

export default router;
