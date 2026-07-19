import { useState } from "react";
import { ThumbsUp, ThumbsDown, Pencil, Trash2 } from "lucide-react";
import { C, FONT_BODY } from "../../lib/theme";
import StarRating from "./StarRating";
import ImageLightbox from "./ImageLightbox";

export default function ReviewList({ reviews, onVote, onEdit, onDelete }) {
  const [openPhoto, setOpenPhoto] = useState(null);

  function handleDelete(id) {
    if (window.confirm("Are you sure you want to delete this review?")) onDelete(id);
  }

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
                <button onClick={() => handleDelete(r.id)} aria-label="Delete review" style={iconBtnStyle}><Trash2 size={13} color={C.muted} /></button>
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
