import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Heart, Star, Trash2, FolderInput, Pencil } from "lucide-react";
import { supabase } from "../supabaseClient";
import {
  getBookmarks, getFolders, removeBookmark, moveBookmark, createFolder, deleteFolder,
  getMyReviews, deleteReview,
} from "../api/engagement";
import { C, FONT_DISPLAY, FONT_BODY } from "../lib/theme";
import { categoryLabel, placeholderImage, priceLabel } from "../lib/vendorDisplay";
import StarRating from "../components/engagement/StarRating";
import ReviewForm from "../components/engagement/ReviewForm";
import { ENGAGEMENT_TEST_MODE } from "../lib/testMode";

export default function EngagementPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [session, setSession] = useState(undefined); // undefined = not checked yet
  const [tab, setTab] = useState(searchParams.get("tab") === "reviews" ? "reviews" : "bookmarks");

  const [bookmarks, setBookmarks] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState("all");
  const [newFolderName, setNewFolderName] = useState("");

  const [reviews, setReviews] = useState([]);
  const [editingReview, setEditingReview] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  useEffect(() => {
    if (!session && !ENGAGEMENT_TEST_MODE) return;
    refreshBookmarks();
    refreshReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  function refreshBookmarks() {
    Promise.all([getBookmarks(), getFolders()])
      .then(([b, f]) => { setBookmarks(b.bookmarks); setFolders(f.folders); })
      .catch((e) => console.error(e.message));
  }
  function refreshReviews() {
    getMyReviews().then((r) => setReviews(r.reviews)).catch((e) => console.error(e.message));
  }

  if (session === undefined) return null;

  if (!session && !ENGAGEMENT_TEST_MODE) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.cream, fontFamily: FONT_BODY }}>
        <div style={{ textAlign: "center", background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "40px 32px" }}>
          <Heart size={28} color={C.gold} style={{ marginBottom: 10 }} />
          <h2 style={{ fontFamily: FONT_DISPLAY, color: C.navy, margin: "0 0 8px" }}>Sign in to see your bookmarks &amp; reviews</h2>
          <button
            onClick={() => navigate("/login")}
            style={{ marginTop: 8, padding: "10px 22px", borderRadius: 10, border: "none", background: C.navy, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const visibleBookmarks = activeFolder === "all"
    ? bookmarks
    : bookmarks.filter((b) => b.folder_id === activeFolder);

  async function handleCreateFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    try {
      await createFolder(name);
      setNewFolderName("");
      refreshBookmarks();
    } catch (e) { console.error(e.message); }
  }

  async function handleDeleteFolder(id) {
    try {
      await deleteFolder(id);
      if (activeFolder === id) setActiveFolder("all");
      refreshBookmarks();
    } catch (e) { console.error(e.message); }
  }

  async function handleRemoveBookmark(vendorId) {
    await removeBookmark(vendorId);
    refreshBookmarks();
  }

  async function handleMoveBookmark(vendorId, folderId) {
    await moveBookmark(vendorId, folderId);
    refreshBookmarks();
  }

  async function handleDeleteReview(id) {
    await deleteReview(id);
    refreshReviews();
  }

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: FONT_BODY }}>
      <header style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "18px 24px" }}>
        <Link to="/map" style={{ fontSize: 12.5, color: C.muted, textDecoration: "none" }}>← Back to TrueBites</Link>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, color: C.navy, margin: "6px 0 0" }}>My Bookmarks &amp; Reviews</h1>
      </header>

      <nav style={{ background: C.card, borderBottom: `1px solid ${C.border}`, display: "flex", gap: 24, padding: "0 24px" }}>
        {[["bookmarks", "Bookmarks"], ["reviews", `My Reviews${reviews.length ? ` (${reviews.length})` : ""}`]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{
              background: "none", border: "none", cursor: "pointer", padding: "12px 2px",
              fontSize: 14, color: tab === key ? C.navy : C.muted,
              borderBottom: tab === key ? `2px solid ${C.gold}` : "2px solid transparent",
              fontWeight: tab === key ? 600 : 400,
            }}>
            {label}
          </button>
        ))}
      </nav>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        {tab === "bookmarks" && (
          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24 }}>
            <aside style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <FolderRow label="All" count={bookmarks.length} active={activeFolder === "all"} onClick={() => setActiveFolder("all")} />
              {folders.map((f) => (
                <FolderRow
                  key={f.id} label={f.name}
                  count={bookmarks.filter((b) => b.folder_id === f.id).length}
                  active={activeFolder === f.id}
                  onClick={() => setActiveFolder(f.id)}
                  onDelete={!f.is_default ? () => handleDeleteFolder(f.id) : null}
                />
              ))}
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                  placeholder="New folder…"
                  style={{ flex: 1, minWidth: 0, padding: "7px 9px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12.5, fontFamily: FONT_BODY }}
                />
                <button onClick={handleCreateFolder} style={{ padding: "0 10px", borderRadius: 8, border: "none", background: C.navy, color: "#fff", cursor: "pointer", fontSize: 16 }}>+</button>
              </div>
            </aside>

            <section>
              {visibleBookmarks.length === 0 ? (
                <Empty icon="🔖" text="No bookmarks in this folder yet." />
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
                  {visibleBookmarks.map((b) => (
                    <BookmarkCard
                      key={b.vendor_id}
                      row={b}
                      folders={folders}
                      onRemove={() => handleRemoveBookmark(b.vendor_id)}
                      onMove={(folderId) => handleMoveBookmark(b.vendor_id, folderId)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {tab === "reviews" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 640 }}>
            {reviews.length === 0 ? (
              <Empty icon="⭐" text="No reviews yet. Rate a vendor from its detail page." />
            ) : (
              reviews.map((r) => (
                <div key={r.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                  {editingReview === r.id ? (
                    <ReviewForm
                      vendorId={r.vendor_id}
                      initial={r}
                      onSaved={(updated) => { setReviews((prev) => prev.map((x) => (x.id === r.id ? { ...x, ...updated } : x))); setEditingReview(null); }}
                      onCancel={() => setEditingReview(null)}
                    />
                  ) : (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <Link to="/map" style={{ fontFamily: FONT_DISPLAY, fontSize: 16, color: C.navy, textDecoration: "none", fontWeight: 700 }}>
                            {r.vendor?.name || "Vendor"}
                          </Link>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                            <StarRating value={r.rating} size={13} />
                            <span style={{ fontSize: 11.5, color: C.muted }}>{new Date(r.created_at).toLocaleDateString()}</span>
                            {r.is_hidden && <span style={{ fontSize: 11, color: "#c0392b" }}>Hidden{r.hidden_reason === "profanity" ? " (flagged for language)" : " by admin"}</span>}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => setEditingReview(r.id)} style={iconBtnStyle} aria-label="Edit review"><Pencil size={13} color={C.muted} /></button>
                          <button onClick={() => handleDeleteReview(r.id)} style={iconBtnStyle} aria-label="Delete review"><Trash2 size={13} color={C.muted} /></button>
                        </div>
                      </div>
                      {r.body && <div style={{ fontSize: 13.5, color: C.text, marginTop: 8, lineHeight: 1.5 }}>{r.body}</div>}
                      {r.review_photos?.length > 0 && (
                        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                          {r.review_photos.map((p) => (
                            <img key={p.id} src={p.url} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8, border: `1px solid ${C.border}` }} />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function FolderRow({ label, count, active, onClick, onDelete }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "8px 10px", borderRadius: 8, cursor: "pointer",
        background: active ? "#fff" : "transparent",
        border: active ? `1px solid ${C.border}` : "1px solid transparent",
        fontSize: 13.5, color: active ? C.navy : C.muted, fontWeight: active ? 600 : 400,
      }}
    >
      <span>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 11.5 }}>{count}</span>
        {onDelete && (
          <Trash2 size={12} onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ opacity: 0.5 }} />
        )}
      </span>
    </div>
  );
}

function BookmarkCard({ row, folders, onRemove, onMove }) {
  const vendor = row.vendor;
  if (!vendor) return null;
  const price = priceLabel(vendor);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ height: 120, position: "relative" }}>
        <img src={placeholderImage(vendor)} alt={vendor.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <button
          onClick={onRemove}
          aria-label="Remove bookmark"
          style={{
            position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: "50%",
            background: "rgba(255,255,255,0.92)", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Heart size={13} color="#e84040" fill="#e84040" />
        </button>
      </div>
      <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 14.5, color: C.navy }}>{vendor.name}</div>
        <div style={{ fontSize: 11.5, color: C.muted, display: "flex", gap: 8 }}>
          <span>{categoryLabel(vendor)}</span>
          {price && <span>{price}</span>}
          {vendor.review_count > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 2 }}><Star size={11} fill={C.gold} color={C.gold} /> {Number(vendor.average_rating).toFixed(1)}</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
          <FolderInput size={13} color={C.muted} />
          <select
            value={row.folder_id || ""}
            onChange={(e) => onMove(e.target.value || null)}
            style={{ flex: 1, minWidth: 0, fontSize: 11.5, padding: "4px 6px", borderRadius: 6, border: `1px solid ${C.border}`, fontFamily: FONT_BODY }}
          >
            {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

function Empty({ icon, text }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "48px 24px", textAlign: "center", color: C.muted }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 14 }}>{text}</div>
    </div>
  );
}

const iconBtnStyle = {
  width: 26, height: 26, borderRadius: "50%", border: "none", background: "#F4F1EA",
  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
};
