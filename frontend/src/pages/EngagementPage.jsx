import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Heart, Trash2, FolderInput, Pencil, Plus } from "lucide-react";
import { supabase } from "../supabaseClient";
import {
  getBookmarks, getFolders, addBookmark, removeBookmark, moveBookmark, createFolder, deleteFolder,
  getMyReviews, deleteReview,
} from "../api/engagement";
import { C, FONT_DISPLAY, FONT_BODY } from "../lib/theme";
import StarRating from "../components/engagement/StarRating";
import ReviewForm from "../components/engagement/ReviewForm";
import Toast from "../components/engagement/Toast";
import DiscoveryHeader from "../components/discovery/DiscoveryHeader";
import { useToast, sleep } from "../lib/useToast";
import VendorCard from "../components/discovery/VendorCard";
import VendorDetailModal from "../components/discovery/VendorDetailModal";
import FolderPickerModal from "../components/engagement/FolderPickerModal";
import ImageLightbox from "../components/engagement/ImageLightbox";
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
  const [creatingFolder, setCreatingFolder] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [editingReview, setEditingReview] = useState(null);
  const [detailVendor, setDetailVendor] = useState(null);
  const [pendingSaveVendor, setPendingSaveVendor] = useState(null); // vendor awaiting a folder pick
  const [openPhoto, setOpenPhoto] = useState(null);
  const [toast, notify] = useToast();
  const bookmarkedVendorIds = new Set(bookmarks.map((b) => b.vendor_id));

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
    getFolders().then((f) => setFolders(f.folders)).catch((e) => console.error(e.message));
    getBookmarks().then((b) => setBookmarks(b.bookmarks)).catch((e) => console.error(e.message));
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
  const meta = session?.user?.user_metadata || {};
  const userEmail = session?.user?.email || "";
  const avatarUrl = meta.avatar_url || "";
  const firstName = meta.first_name || "";
  const initials = firstName
    ? (meta.first_name?.[0] || "") + (meta.last_name?.[0] || "")
    : (userEmail ? userEmail.slice(0, 2).toUpperCase() : "?");

  async function handleCreateFolder() {
    const name = newFolderName.trim();
    if (!name) { notify("Folder name is required.", true); return; }
    const exists = folders.some((f) => f.name.toLowerCase() === name.toLowerCase());
    if (exists) { notify("A folder with this name already exists.", true); return; }
    try {
      await createFolder(name);
      setNewFolderName("");
      setCreatingFolder(false);
      refreshBookmarks();
      notify("Folder created successfully!");
    } catch (e) { notify(e.message, true); }
  }

  async function handleDeleteFolder(id) {
    try {
      await deleteFolder(id);
      if (activeFolder === id) setActiveFolder("all");
      refreshBookmarks();
    } catch (e) { notify(e.message, true); }
  }

  async function handleRemoveBookmark(vendorId) {
    try {
      await removeBookmark(vendorId);
      refreshBookmarks();
      notify("Vendor removed from wishlist.");
    } catch (e) { notify(e.message, true); }
  }

  async function handleMoveBookmark(vendorId, folderId) {
    try {
      await moveBookmark(vendorId, folderId);
      refreshBookmarks();
    } catch (e) { notify(e.message, true); }
  }

  // The vendor-detail modal is reachable from both the Bookmarks tab (always
  // bookmarked) and the Reviews tab (may or may not be) — so the heart there
  // needs to actually branch, unlike the plain "remove" hearts on the bookmark grid.
  function toggleBookmarkFromDetail(vendorId) {
    if (bookmarkedVendorIds.has(vendorId)) { handleRemoveBookmark(vendorId); return; }
    setPendingSaveVendor(detailVendor);
  }

  async function confirmSaveBookmark(folderId) {
    await addBookmark(pendingSaveVendor.id, folderId);
    setPendingSaveVendor(null);
    refreshBookmarks();
    notify("Vendor bookmarked!");
  }

  async function createFolderAndSave(name) {
    const { folder } = await createFolder(name);
    notify("Folder created successfully!");
    refreshBookmarks();
    await sleep(1200);
    await confirmSaveBookmark(folder.id);
  }

  async function handleDeleteReview(id) {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await deleteReview(id);
      refreshReviews();
      notify("Review deleted successfully!");
    } catch (e) { notify(e.message, true); }
  }

  return (
    <div className="engagement-page" style={{ minHeight: "100vh", background: C.cream, fontFamily: FONT_BODY }}>
      <DiscoveryHeader
        onOpenMap={() => navigate("/map?view=map")}
        session={session}
        userEmail={userEmail}
        initials={initials}
        firstName={firstName}
        avatarUrl={avatarUrl}
        savedCount={bookmarks.length}
        activeSection={tab === "reviews" ? "reviews" : "saved"}
        onOpenDiscover={() => navigate("/map")}
        onOpenSaved={() => { setTab("bookmarks"); navigate("/engagement"); }}
        onOpenReviews={() => { setTab("reviews"); navigate("/engagement?tab=reviews"); }}
        onLogin={() => navigate("/login")}
        onSignUp={() => navigate("/login")}
        onOpenProfile={() => navigate("/profile")}
      />

      <main className="engagement-main" style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        <div className="engagement-heading">
          <p className="discovery-kicker">Your TrueBites collection</p>
          <h1 style={{ fontFamily: FONT_DISPLAY }}>{tab === "reviews" ? "My reviews" : "Saved places"}</h1>
          <p>{tab === "reviews" ? "Keep track of the places and flavours you have shared." : "Keep the Melaka places you want to return to."}</p>
        </div>
        {tab === "bookmarks" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Folder tabs — horizontal row, Instagram-style */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
              <FolderPill label="All" count={bookmarks.length} active={activeFolder === "all"} onClick={() => setActiveFolder("all")} />
              {folders.map((f) => (
                <FolderPill
                  key={f.id} label={f.name}
                  count={bookmarks.filter((b) => b.folder_id === f.id).length}
                  active={activeFolder === f.id}
                  onClick={() => setActiveFolder(f.id)}
                  onDelete={!f.is_default ? () => handleDeleteFolder(f.id) : null}
                />
              ))}

              {creatingFolder ? (
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <input
                    autoFocus
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                    placeholder="Folder name"
                    style={{ width: 140, padding: "7px 9px", borderRadius: 20, border: `1px solid ${C.border}`, fontSize: 12.5, fontFamily: FONT_BODY }}
                  />
                  <button onClick={handleCreateFolder} style={{ padding: "0 12px", borderRadius: 20, border: "none", background: C.navy, color: "#fff", cursor: "pointer", fontSize: 12.5, fontFamily: FONT_BODY }}>Create</button>
                </div>
              ) : (
                <button
                  onClick={() => setCreatingFolder(true)}
                  style={{
                    display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
                    padding: "7px 12px", borderRadius: 20, border: `1px dashed ${C.border}`,
                    background: "transparent", color: C.muted, cursor: "pointer",
                    fontSize: 12.5, fontFamily: FONT_BODY,
                  }}
                >
                  <Plus size={13} /> New folder
                </button>
              )}
            </div>

            <section>
              {visibleBookmarks.length === 0 ? (
                <Empty icon="🔖" text="No bookmarks in this folder yet." />
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
                  {visibleBookmarks.filter((b) => b.vendor).map((b) => (
                    <div key={b.vendor_id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <VendorCard
                        vendor={b.vendor}
                        inTrip={false}
                        bookmarked={true}
                        onToggleBookmark={() => handleRemoveBookmark(b.vendor_id)}
                        onAddStop={() => notify("Open this vendor from the map to add it to your trip.")}
                        onOpenDetail={setDetailVendor}
                      />
                      <FolderMoveSelect row={b} folders={folders} onMove={(folderId) => handleMoveBookmark(b.vendor_id, folderId)} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {tab === "reviews" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 640, margin: "0 auto" }}>
            {reviews.length === 0 ? (
              <Empty icon="⭐" text="No reviews yet. Be the first to review!" />
            ) : (
              reviews.map((r) => (
                <div key={r.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                  {editingReview === r.id ? (
                    <ReviewForm
                      vendorId={r.vendor_id}
                      initial={r}
                      onSaved={(updated) => { setReviews((prev) => prev.map((x) => (x.id === r.id ? { ...x, ...updated } : x))); setEditingReview(null); }}
                      onCancel={() => setEditingReview(null)}
                      notify={notify}
                    />
                  ) : (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <button
                            onClick={() => r.vendor && setDetailVendor(r.vendor)}
                            disabled={!r.vendor}
                            style={{
                              background: "none", border: "none", padding: 0, textAlign: "left",
                              fontFamily: FONT_DISPLAY, fontSize: 16, color: C.navy, fontWeight: 700,
                              cursor: r.vendor ? "pointer" : "default",
                            }}
                          >
                            {r.vendor?.name || "Vendor"}
                          </button>
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
                            <img
                              key={p.id} src={p.url} alt=""
                              onClick={() => setOpenPhoto(p.url)}
                              style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8, border: `1px solid ${C.border}`, cursor: "zoom-in" }}
                            />
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

      {detailVendor && (
        <VendorDetailModal
          vendor={detailVendor}
          inTrip={false}
          bookmarked={bookmarkedVendorIds.has(detailVendor.id)}
          onToggleBookmark={() => toggleBookmarkFromDetail(detailVendor.id)}
          onAddStop={() => notify("Open this vendor from the map to add it to your trip.")}
          onClose={() => setDetailVendor(null)}
        />
      )}

      {pendingSaveVendor && (
        <FolderPickerModal
          vendorName={pendingSaveVendor.name}
          folders={folders}
          onClose={() => setPendingSaveVendor(null)}
          onSave={confirmSaveBookmark}
          onCreateFolder={createFolderAndSave}
        />
      )}

      <ImageLightbox src={openPhoto} onClose={() => setOpenPhoto(null)} />
      <Toast toast={toast} />
    </div>
  );
}

function FolderPill({ label, count, active, onClick, onDelete }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6, flexShrink: 0, whiteSpace: "nowrap",
        padding: "7px 12px", borderRadius: 20, cursor: "pointer",
        background: active ? C.navy : "#fff",
        border: `1px solid ${active ? C.navy : C.border}`,
        fontSize: 13, color: active ? "#fff" : C.navy, fontWeight: active ? 600 : 400,
        fontFamily: FONT_BODY,
      }}
    >
      <span>{label}</span>
      <span style={{ fontSize: 11, opacity: 0.75 }}>{count}</span>
      {onDelete && (
        <Trash2
          size={12}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{ opacity: 0.6 }}
        />
      )}
    </div>
  );
}

function FolderMoveSelect({ row, folders, onMove }) {
  if (folders.length === 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 2px" }}>
      <FolderInput size={13} color={C.muted} />
      <select
        value={row.folder_id || ""}
        onChange={(e) => onMove(e.target.value || null)}
        style={{ flex: 1, minWidth: 0, fontSize: 11.5, padding: "4px 6px", borderRadius: 6, border: `1px solid ${C.border}`, fontFamily: FONT_BODY }}
      >
        {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
      </select>
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
  width: 26, height: 26, borderRadius: "50%", border: "none", background: C.cream,
  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
};
