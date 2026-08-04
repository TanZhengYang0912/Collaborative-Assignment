import { Bookmark, Check, Footprints, MapPin, Play, Plus, Star, Wallet } from "lucide-react";
import {
  categoryLabel, distanceLabel, placeholderImage, creatorHandle,
  priceLabel, walkLabel,
} from "../../lib/vendorDisplay";

const TERRACOTTA = "#A35D47";
const INK = "#202A35";
const FOREST = "#40544A";

// Image is taller on phones (one card per row) and returns to the catalog crop
// once the grid has two or more columns.
const IMAGE = "relative h-[220px] cursor-pointer bg-sand sm:h-[170px] xl:h-[210px]";

export default function VendorCard({ vendor, inTrip, bookmarked, onToggleBookmark, onAddStop, onOpenDetail }) {
  const handle = creatorHandle(vendor);
  const price = priceLabel(vendor);
  const walk = walkLabel(vendor);
  const dist = distanceLabel(vendor);
  const area = vendor.address?.split(",")[0]?.trim() || "Melaka";
  const description = vendor.ai_review_summary || vendor.signature_dishes || "A local place worth taking the long way for.";

  return (
    <article className="min-w-0 overflow-hidden rounded border border-sand bg-white transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-forest hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className={IMAGE} onClick={() => onOpenDetail(vendor)}>
        <img src={placeholderImage(vendor)} alt={vendor.name} loading="lazy" className="block size-full object-cover" />

        <button
          type="button"
          onClick={(event) => { event.stopPropagation(); onToggleBookmark(vendor.id); }}
          aria-label={bookmarked ? "Remove saved place" : "Save place"}
          title={bookmarked ? "Remove saved place" : "Save place"}
          className="absolute right-2 top-2 grid size-11 place-items-center rounded-sm border border-white/80 bg-white/90 text-ink transition-colors hover:text-terracotta active:scale-97 motion-reduce:transition-none"
        >
          <Bookmark size={16} fill={bookmarked ? TERRACOTTA : "none"} color={bookmarked ? TERRACOTTA : INK} strokeWidth={1.7} />
        </button>

        <span className="absolute bottom-3 left-3 bg-chalk/95 px-2 py-[5px] text-[10px] font-bold uppercase tracking-[0.08em] text-forest">
          {categoryLabel(vendor)}
        </span>
      </div>

      <div className="flex min-h-[166px] flex-col p-4">
        <h2
          onClick={() => onOpenDetail(vendor)}
          className="m-0 cursor-pointer font-display text-[19px] font-semibold leading-[1.15] text-ink"
        >
          {vendor.name}
        </h2>
        <p className="mb-4 mt-2 line-clamp-2 overflow-hidden text-xs leading-normal text-muted">
          {description}
        </p>

        {vendor.review_count > 0 && (
          <div className="mt-2.5 inline-flex items-center gap-1 text-[11px] text-muted">
            <Star size={12} color={TERRACOTTA} fill={TERRACOTTA} />
            <strong>{Number(vendor.average_rating).toFixed(1)}</strong>
            <span>({vendor.review_count})</span>
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 text-[11px] text-muted [&_svg]:shrink-0">
          <MapPin size={12} />
          <span>{area}</span>
          {dist && <><span className="text-sand">·</span><span>{dist}</span></>}
          {walk && <><Footprints size={12} /><span>{walk}</span></>}
          {price && <><Wallet size={12} /><span>{price}</span></>}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-forest">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <Play size={11} fill={FOREST} /> <span className="truncate">{handle || "TrueBites guide"}</span>
          </span>
          <button
            type="button"
            onClick={() => !inTrip && onAddStop(vendor)}
            disabled={inTrip}
            aria-label={inTrip ? "Already added to trip" : "Add to trip"}
            className={inTrip
              ? "inline-flex min-h-11 items-center gap-1 text-[11px] font-semibold text-muted"
              : "inline-flex min-h-11 items-center gap-1 text-[11px] font-semibold text-forest active:scale-97"}
          >
            {inTrip ? <Check size={12} /> : <Plus size={12} />}
            {inTrip ? "Added" : "Add to trip"}
          </button>
        </div>
      </div>
    </article>
  );
}
