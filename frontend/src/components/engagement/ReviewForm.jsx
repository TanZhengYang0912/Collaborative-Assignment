import { useState } from "react";
import { Camera } from "lucide-react";
import { C, FONT_BODY } from "../../lib/theme";
import { createReview, updateReview, uploadReviewPhoto } from "../../api/engagement";
import StarRating from "./StarRating";

// initial=null -> write a new review. initial={id,rating,body} -> edit own review.
export default function ReviewForm({ vendorId, initial, onSaved, onCancel }) {
  const [rating, setRating] = useState(initial?.rating || 0);
  const [body, setBody] = useState(initial?.body || "");
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rating) { setError("Pick a star rating"); return; }
    setSaving(true);
    setError("");
    try {
      const { review } = initial
        ? await updateReview(initial.id, { rating, body })
        : await createReview(vendorId, { rating, body });

      let photos = initial?.review_photos || [];
      if (photoFile) {
        const { photo } = await uploadReviewPhoto(review.id, photoFile);
        photos = [...photos, photo];
      }

      onSaved({ ...review, review_photos: photos, isOwn: true, likes: initial?.likes ?? 0, dislikes: initial?.dislikes ?? 0, myVote: initial?.myVote ?? null });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <StarRating value={rating} onChange={setRating} size={22} />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share what you tried and how it was…"
        rows={3}
        style={{
          resize: "vertical", padding: "10px 12px", borderRadius: 10,
          border: `1px solid ${C.border}`, fontFamily: FONT_BODY, fontSize: 13.5,
        }}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: C.muted, cursor: "pointer" }}>
          <Camera size={15} />
          {photoFile ? photoFile.name : "Add a photo"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
            style={{ display: "none" }}
          />
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: FONT_BODY }}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: C.navy, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT_BODY }}
          >
            {saving ? "Saving…" : initial ? "Save changes" : "Post review"}
          </button>
        </div>
      </div>
      {error && <div style={{ fontSize: 12.5, color: "#c0392b" }}>{error}</div>}
    </form>
  );
}
