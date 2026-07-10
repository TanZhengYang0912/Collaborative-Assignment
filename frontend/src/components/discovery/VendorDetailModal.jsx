import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Heart, Bot, Play, Wallet, Footprints, MapPin, Star } from "lucide-react";
import { C, FONT_DISPLAY, FONT_BODY } from "../../lib/theme";
import {
  categoryLabel, placeholderImage, creatorHandle,
  priceLabel, walkLabel, distanceLabel,
} from "../../lib/vendorDisplay";
import { supabase } from "../../supabaseClient";
import { getReviews, deleteReview, voteReview, removeVote } from "../../api/engagement";
import ReviewForm from "../engagement/ReviewForm";
import ReviewList from "../engagement/ReviewList";
import { ENGAGEMENT_TEST_MODE } from "../../lib/testMode";

export default function VendorDetailModal({ vendor, inTrip, bookmarked, onToggleBookmark, onAddStop, onClose }) {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [editingReview, setEditingReview] = useState(null); // "new" | review object | null

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!vendor) return;
    setReviewsLoading(true);
    setEditingReview(null);
    getReviews(vendor.id)
      .then((r) => setReviews(r.reviews))
      .catch((e) => console.error("failed to load reviews:", e.message))
      .finally(() => setReviewsLoading(false));
  }, [vendor?.id]);

  const myReview = reviews.find((r) => r.isOwn);

  async function handleVote(reviewId, isLike) {
    if (!session && !ENGAGEMENT_TEST_MODE) { navigate("/login"); return; }
    try {
      isLike === null ? await removeVote(reviewId) : await voteReview(reviewId, isLike);
      const r = await getReviews(vendor.id);
      setReviews(r.reviews);
    } catch (e) { console.error(e.message); }
  }

  async function handleDeleteReview(id) {
    try {
      await deleteReview(id);
      const r = await getReviews(vendor.id);
      setReviews(r.reviews);
    } catch (e) { console.error(e.message); }
  }

  function handleReviewSaved(review) {
    setReviews((prev) => {
      const exists = prev.some((r) => r.id === review.id);
      return exists ? prev.map((r) => (r.id === review.id ? review : r)) : [review, ...prev];
    });
    setEditingReview(null);
  }

  useEffect(() => {
    if (document.getElementById("truebites-modal-fade-style")) return;
    const s = document.createElement("style");
    s.id = "truebites-modal-fade-style";
    s.textContent = `@media (prefers-reduced-motion: no-preference) {
      @keyframes trueBitesFadeIn { from { opacity: 0 } to { opacity: 1 } }
      .truebites-modal-backdrop { animation: trueBitesFadeIn 180ms ease-out; }
    }`;
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (!vendor) return null;

  const handle = creatorHandle(vendor);
  const price = priceLabel(vendor);
  const walk = walkLabel(vendor);
  const dist = distanceLabel(vendor);
  const tags = (vendor.cuisine_types || vendor.signature_dishes || "")
    .split(",").map((t) => t.trim()).filter(Boolean);

  return (
    <div
      onClick={onClose}
      className="truebites-modal-backdrop"
      style={{
        position: "fixed", inset: 0, background: "rgba(27,42,74,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 520, maxHeight: "88vh", overflowY: "auto",
          background: C.card, borderRadius: 16, fontFamily: FONT_BODY,
          boxShadow: "0 20px 60px rgba(27,42,74,0.35)",
        }}
      >
        {/* Hero image */}
        <div style={{ position: "relative", height: 220, borderRadius: "16px 16px 0 0", overflow: "hidden" }}>
          <img src={placeholderImage(vendor)} alt={vendor.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(27,42,74,0.72) 0%, transparent 55%)",
          }} />
          {/* Category badge */}
          <span style={{
            position: "absolute", top: 12, left: 12, padding: "4px 11px", borderRadius: 20,
            background: C.navy, color: "#fff", fontSize: 11, fontWeight: 600,
            letterSpacing: 0.5, textTransform: "uppercase",
          }}>
            {categoryLabel(vendor)}
          </span>
          {/* Action buttons */}
          <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 8 }}>
            <IconBtn onClick={() => onToggleBookmark(vendor.id)}>
              <Heart size={15} color={bookmarked ? "#e84040" : "#fff"} fill={bookmarked ? "#e84040" : "none"} />
            </IconBtn>
            <IconBtn onClick={onClose}><X size={16} color="#fff" /></IconBtn>
          </div>
          {/* Vendor name over gradient */}
          <div style={{
            position: "absolute", bottom: 14, left: 16, right: 16,
            fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 22, color: "#fff",
          }}>
            {vendor.name}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "18px 20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Meta row */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: C.muted }}>
            {vendor.review_count > 0 && (
              <MetaItem
                icon={<Star size={14} color={C.gold} fill={C.gold} />}
                text={`${Number(vendor.average_rating).toFixed(1)} (${vendor.review_count} review${vendor.review_count === 1 ? "" : "s"})`}
              />
            )}
            {dist && <MetaItem icon={<MapPin size={14} color={C.gold} />} text={`${dist} away`} />}
            {walk && <MetaItem icon={<Footprints size={14} color={C.gold} />} text={walk} />}
            {price && <MetaItem icon={<Wallet size={14} color={C.gold} />} text={`${price}/person`} />}
          </div>

          {vendor.address && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 13, color: C.muted }}>
              <MapPin size={14} style={{ marginTop: 2, flexShrink: 0, color: C.gold }} /> {vendor.address}
            </div>
          )}

          {/* Cuisine/dish tags */}
          {tags.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {tags.map((t) => (
                <span key={t} style={{
                  padding: "4px 11px", borderRadius: 20, background: C.cream,
                  border: `1px solid ${C.border}`, fontSize: 12, color: C.text,
                }}>{t}</span>
              ))}
            </div>
          )}

          {/* AI Review — gold left-border */}
          {vendor.ai_review_summary && (
            <div style={{
              background: "#FAFAF7",
              borderLeft: `3px solid ${C.gold}`,
              borderRadius: "0 10px 10px 0",
              padding: "12px 14px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 5,
                    color: C.gold, fontWeight: 700, fontSize: 10.5, letterSpacing: 0.8,
                    textTransform: "uppercase",
                  }}>
                    <Bot size={13} /> AI Review Summary
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>Extracted from TikTok video transcript</div>
                </div>
                {handle && (
                  <span style={{ display: "flex", alignItems: "center", gap: 3, color: C.muted, fontSize: 11.5, flexShrink: 0 }}>
                    <Play size={9} fill={C.muted} /> {handle}
                  </span>
                )}
              </div>
              <div style={{ color: C.text, fontSize: 13.5, lineHeight: 1.5 }}>
                "{vendor.ai_review_summary}"
              </div>
            </div>
          )}

          {/* CTA row */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => onAddStop(vendor)}
              disabled={inTrip}
              style={{
                flex: 1, padding: "12px 16px", borderRadius: 10, fontSize: 14.5, fontWeight: 600,
                fontFamily: FONT_BODY, cursor: inTrip ? "default" : "pointer",
                background: inTrip ? C.cream : C.navy,
                color: inTrip ? C.navy : "#fff",
                border: `1.5px solid ${inTrip ? C.border : C.navy}`,
                transition: "all 0.15s ease",
              }}
            >
              {inTrip ? "✓ Already in Your Trip" : "+ Add to Trip"}
            </button>
            <IconBtn onClick={() => onToggleBookmark(vendor.id)} bordered>
              <Heart size={16} color={bookmarked ? "#e84040" : C.muted} fill={bookmarked ? "#e84040" : "none"} />
            </IconBtn>
          </div>

          {/* Reviews */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, color: C.navy, margin: 0 }}>Reviews</h3>
              {!myReview && editingReview !== "new" && (
                <button
                  onClick={() => { if (!session && !ENGAGEMENT_TEST_MODE) { navigate("/login"); return; } setEditingReview("new"); }}
                  style={{ background: "none", border: "none", color: C.gold, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: FONT_BODY }}
                >
                  + Write a review
                </button>
              )}
            </div>

            {editingReview && (
              <div style={{ marginBottom: 14 }}>
                <ReviewForm
                  vendorId={vendor.id}
                  initial={editingReview === "new" ? null : editingReview}
                  onSaved={handleReviewSaved}
                  onCancel={() => setEditingReview(null)}
                />
              </div>
            )}

            {reviewsLoading ? (
              <div style={{ fontSize: 13, color: C.muted }}>Loading reviews…</div>
            ) : (
              <ReviewList
                reviews={reviews.filter((r) => editingReview !== r)}
                onVote={handleVote}
                onEdit={setEditingReview}
                onDelete={handleDeleteReview}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaItem({ icon, text }) {
  return <span style={{ display: "flex", alignItems: "center", gap: 5 }}>{icon}{text}</span>;
}

function IconBtn({ onClick, children, bordered }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 40, height: 40, borderRadius: "50%", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        background: bordered ? "#fff" : "rgba(27,42,74,0.55)",
        border: bordered ? `1.5px solid ${C.border}` : "none",
      }}
    >
      {children}
    </button>
  );
}
