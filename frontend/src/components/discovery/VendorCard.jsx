import { Bookmark, Check, Footprints, MapPin, Play, Plus, Star, Wallet } from "lucide-react";
import { C, FONT_BODY, FONT_DISPLAY } from "../../lib/theme";
import {
  categoryLabel, distanceLabel, placeholderImage, creatorHandle,
  priceLabel, walkLabel,
} from "../../lib/vendorDisplay";

export default function VendorCard({ vendor, inTrip, bookmarked, onToggleBookmark, onAddStop, onOpenDetail }) {
  const handle = creatorHandle(vendor);
  const price = priceLabel(vendor);
  const walk = walkLabel(vendor);
  const dist = distanceLabel(vendor);
  const area = vendor.address?.split(",")[0]?.trim() || "Melaka";
  const description = vendor.ai_review_summary || vendor.signature_dishes || "A local place worth taking the long way for.";

  return (
    <article className="catalog-card" style={{ fontFamily: FONT_BODY }}>
      <div className="catalog-card-image" onClick={() => onOpenDetail(vendor)}>
        <img src={placeholderImage(vendor)} alt={vendor.name} loading="lazy" />

        <button
          type="button"
          className="catalog-card-save"
          onClick={(event) => { event.stopPropagation(); onToggleBookmark(vendor.id); }}
          aria-label={bookmarked ? "Remove saved place" : "Save place"}
          title={bookmarked ? "Remove saved place" : "Save place"}
        >
          <Bookmark size={16} fill={bookmarked ? C.gold : "none"} color={bookmarked ? C.gold : C.text} strokeWidth={1.7} />
        </button>

        <span className="catalog-card-category">{categoryLabel(vendor)}</span>
      </div>

      <div className="catalog-card-body">
        <h2 className="catalog-card-title" style={{ fontFamily: FONT_DISPLAY }} onClick={() => onOpenDetail(vendor)}>
          {vendor.name}
        </h2>
        <p className="catalog-card-description">{description}</p>

        {vendor.review_count > 0 && (
          <div className="catalog-card-rating">
            <Star size={12} color={C.gold} fill={C.gold} />
            <strong>{Number(vendor.average_rating).toFixed(1)}</strong>
            <span>({vendor.review_count})</span>
          </div>
        )}

        <div className="catalog-card-meta">
          <MapPin size={12} />
          <span>{area}</span>
          {dist && <><span className="catalog-card-meta-divider">·</span><span>{dist}</span></>}
          {walk && <><Footprints size={12} /><span>{walk}</span></>}
          {price && <><Wallet size={12} /><span>{price}</span></>}
        </div>

        <div className="catalog-card-source" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Play size={11} fill={C.navy} /> {handle || "TrueBites guide"}
          </span>
          <button
            type="button"
            onClick={() => !inTrip && onAddStop(vendor)}
            disabled={inTrip}
            style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: 0, border: 0, background: "transparent", color: inTrip ? C.muted : C.navy, fontSize: 11, fontWeight: 600, cursor: inTrip ? "default" : "pointer" }}
            aria-label={inTrip ? "Already added to trip" : "Add to trip"}
          >
            {inTrip ? <Check size={12} /> : <Plus size={12} />}
            {inTrip ? "Added" : "Add to trip"}
          </button>
        </div>
      </div>
    </article>
  );
}
