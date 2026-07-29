import { useState } from "react";
import { ThumbsUp, ThumbsDown, Pencil, Trash2 } from "lucide-react";
import { C, FONT_DISPLAY, FONT_BODY } from "../../lib/theme";
import StarRating from "./StarRating";
import ImageLightbox from "./ImageLightbox";

export default function ReviewList({ reviews, onVote, onEdit, onDelete }) {
  const [openPhoto, setOpenPhoto] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  if (!reviews.length) {
    return <div style={{ fontSize: 13, color: C.muted, padding: "8px 0" }}>No reviews yet. Be the first to review!</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {reviews.map((r) => (
        <div key={r.id} style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: FONT_BODY }}>
                {r.author_name || "Anonymous"}{r.isOwn && <span style={{ color: C.gold, fontWeight: 500 }}> · You</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                <StarRating value={r.rating} size={13} />
                <span style={{ fontSize: 11.5, color: C.muted }}>{new Date(r.created_at).toLocaleDateString()}</span>
                {r.isOwn && r.is_hidden && (
                  <span style={{ fontSize: 11, color: "#c0392b" }}>
                    Hidden{r.hidden_reason === "profanity" ? " (flagged for language)" : " by admin"} — only you can see this
                  </span>
                )}
              </div>
            </div>
            {r.isOwn && (
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => onEdit(r)} aria-label="Edit review" style={iconBtnStyle}><Pencil size={13} color={C.muted} /></button>
                <button onClick={() => setPendingDelete(r.id)} aria-label="Delete review" style={iconBtnStyle}><Trash2 size={13} color={C.muted} /></button>
              </div>
            )}
          </div>

          {r.body && <div style={{ fontSize: 13.5, color: C.text, marginTop: 6, lineHeight: 1.5 }}>{r.body}</div>}

          {r.review_photos?.length > 0 && (
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {r.review_photos.map((p) => (
                <img
                  key={p.id} src={p.url} alt="Review attachment"
                  onClick={() => setOpenPhoto(p.url)}
                  style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, border: `1px solid ${C.border}`, cursor: "zoom-in" }}
                />
              ))}
            </div>
          )}

          {!r.isOwn && (
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button
                onClick={() => onVote(r.id, r.myVote === true ? null : true)}
                style={{ ...voteBtnStyle, color: r.myVote === true ? C.gold : C.muted }}
              >
                <ThumbsUp size={13} fill={r.myVote === true ? C.gold : "none"} /> {r.likes}
              </button>
              <button
                onClick={() => onVote(r.id, r.myVote === false ? null : false)}
                style={{ ...voteBtnStyle, color: r.myVote === false ? C.gold : C.muted }}
              >
                <ThumbsDown size={13} fill={r.myVote === false ? C.gold : "none"} /> {r.dislikes}
              </button>
            </div>
          )}
        </div>
      ))}
      <ImageLightbox src={openPhoto} onClose={() => setOpenPhoto(null)} />

      {pendingDelete && (
        <div
          onClick={() => setPendingDelete(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(27,42,74,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: 20 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 340, background: C.card, borderRadius: 14, padding: 22, fontFamily: FONT_BODY, boxShadow: "0 20px 60px rgba(27,42,74,0.35)" }}>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: C.navy, margin: "0 0 6px" }}>Delete this review?</h3>
            <p style={{ fontSize: 13, color: C.muted, margin: "0 0 18px" }}>This can't be undone.</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setPendingDelete(null)} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: FONT_BODY }}>Cancel</button>
              <button onClick={() => { onDelete(pendingDelete); setPendingDelete(null); }} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#c0392b", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT_BODY }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const iconBtnStyle = {
  width: 26, height: 26, borderRadius: "50%", border: "none", background: C.cream,
  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
};

const voteBtnStyle = {
  display: "flex", alignItems: "center", gap: 4, background: "none", border: "none",
  cursor: "pointer", fontSize: 12.5, fontFamily: FONT_BODY, padding: 0,
};
