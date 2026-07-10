import { Heart, Bot, Play, Wallet, Footprints, MapPin, Plus, Check, Star } from "lucide-react";
import { C, FONT_DISPLAY, FONT_BODY } from "../../lib/theme";
import {
  categoryLabel, placeholderImage, creatorHandle,
  priceLabel, walkLabel, distanceLabel,
} from "../../lib/vendorDisplay";

// Figma card layout:
// - Photo (top, ~190px) with:
//   - heart icon top-LEFT (bookmark)
//   - navy "+" / "✓" circle top-RIGHT (add-to-trip)
//   - navy category badge bottom-LEFT over photo
// - Name in Playfair Display
// - Gold-bordered AI Review box with "AI REVIEW" gold label
// - Compact meta row: 📍 walk-min · RM price (left), @creator (right)
// Ratings row stays omitted (data is mostly null).
export default function VendorCard({ vendor, inTrip, bookmarked, onToggleBookmark, onAddStop, onOpenDetail }) {
  const handle = creatorHandle(vendor);
  const price = priceLabel(vendor);
  const walk = walkLabel(vendor);
  const dist = distanceLabel(vendor);

  return (
    <div style={{
      background: C.card, borderRadius: 14, overflow: "hidden",
      border: `1px solid ${C.border}`, display: "flex", flexDirection: "column",
      fontFamily: FONT_BODY, boxShadow: "0 2px 8px rgba(27,42,74,0.06)",
    }}>
      {/* Photo */}
      <div
        onClick={() => onOpenDetail(vendor)}
        style={{ position: "relative", height: 190, cursor: "pointer", background: C.cream, flexShrink: 0 }}
      >
        <img
          src={placeholderImage(vendor)}
          alt={vendor.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />

        {/* Heart bookmark — top-left */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleBookmark(vendor.id); }}
          aria-label={bookmarked ? "Remove bookmark" : "Save vendor"}
          style={{
            position: "absolute", top: 10, left: 10,
            width: 30, height: 30, borderRadius: "50%",
            background: "rgba(255,255,255,0.92)", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
          }}
        >
          <Heart size={15} color={bookmarked ? "#e84040" : C.muted} fill={bookmarked ? "#e84040" : "none"} />
        </button>

        {/* Add-to-trip circle — top-right */}
        <button
          onClick={(e) => { e.stopPropagation(); onAddStop(vendor); }}
          aria-label={inTrip ? "Already in trip" : "Add to trip"}
          style={{
            position: "absolute", top: 10, right: 10,
            width: 30, height: 30, borderRadius: "50%",
            background: inTrip ? C.gold : C.navy, border: "none", cursor: inTrip ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          }}
        >
          {inTrip
            ? <Check size={14} color="#fff" strokeWidth={2.5} />
            : <Plus size={14} color="#fff" strokeWidth={2.5} />
          }
        </button>

        {/* Category badge — bottom-left over photo */}
        <span style={{
          position: "absolute", bottom: 10, left: 10,
          padding: "4px 10px", borderRadius: 20,
          background: C.navy, color: "#fff",
          fontSize: 11, fontWeight: 600, letterSpacing: 0.4,
          textTransform: "uppercase",
        }}>
          {categoryLabel(vendor)}
        </span>
      </div>

      {/* Card body */}
      <div style={{ padding: "13px 14px 14px", display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
        {/* Vendor name */}
        <div
          onClick={() => onOpenDetail(vendor)}
          style={{
            fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16.5,
            color: C.navy, cursor: "pointer", lineHeight: 1.25,
          }}
        >
          {vendor.name}
        </div>

        {/* Rating — only for vendors with at least one real review */}
        {vendor.review_count > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, color: C.muted }}>
            <Star size={12} color={C.gold} fill={C.gold} />
            <span style={{ fontWeight: 600, color: C.navy }}>{Number(vendor.average_rating).toFixed(1)}</span>
            <span>({vendor.review_count})</span>
          </div>
        )}

        {/* AI Review block — gold left border */}
        {vendor.ai_review_summary && (
          <div style={{
            background: "#FAFAF7",
            borderLeft: `3px solid ${C.gold}`,
            borderRadius: "0 8px 8px 0",
            padding: "8px 11px",
            fontSize: 12.5,
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 4,
            }}>
              <span style={{
                display: "flex", alignItems: "center", gap: 4,
                color: C.gold, fontWeight: 700, fontSize: 10, letterSpacing: 0.8,
                textTransform: "uppercase",
              }}>
                <Bot size={11} /> AI Review
              </span>
              {handle && (
                <span style={{ display: "flex", alignItems: "center", gap: 3, color: C.muted, fontSize: 10.5 }}>
                  <Play size={8} fill={C.muted} /> {handle}
                </span>
              )}
            </div>
            <div style={{
              color: C.text, lineHeight: 1.45,
              display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              "{vendor.ai_review_summary}"
            </div>
          </div>
        )}

        {/* Compact meta row */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 12, color: C.muted, marginTop: "auto",
        }}>
          <div style={{ display: "flex", gap: 8 }}>
            {dist && (
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <MapPin size={11} /> {dist}
              </span>
            )}
            {walk && (
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Footprints size={11} /> {walk}
              </span>
            )}
            {price && (
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Wallet size={11} /> {price}
              </span>
            )}
          </div>
          {handle && (
            <span style={{ color: C.gold, fontSize: 11, fontWeight: 500 }}>{handle}</span>
          )}
        </div>
      </div>
    </div>
  );
}
