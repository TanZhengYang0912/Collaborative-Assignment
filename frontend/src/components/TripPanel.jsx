import { useState } from "react";
import { Navigation, GripVertical, X, Pencil, Sparkles, Route, Clock, Plus, ExternalLink, ChevronDown, MapPin, LocateFixed, Eye, EyeOff } from "lucide-react";
import LocationInput from "./LocationInput";
import TransitDetails from "./TransitDetails";
import RouteOptions from "./RouteOptions";
import { MAP_COLORS } from "../lib/mapColors";
import { placeholderImage, priceLabel, distanceLabel } from "../lib/vendorDisplay";
import { buildGoogleMapsUrl } from "../lib/googleMapsHandoff";

const NAV_MODES = [
  { mode: "DRIVING",     label: "Car",        icon: "🚗",  color: "#1d72e8" },
  { mode: "TWO_WHEELER", label: "Motorcycle", icon: "🏍️", color: "#e87c1d" },
  { mode: "TRANSIT",     label: "Transit",    icon: "🚌",  color: "#1da84b" },
  { mode: "WALKING",     label: "Walking",    icon: "🚶",  color: "#8e44ad" },
];

// Bottom sheet on phones, the original floating side panel from md up.
const PANEL =
  "fixed inset-x-0 bottom-0 z-20 max-h-[60dvh] w-full overflow-y-auto rounded-t-2xl border border-sand bg-white p-4 shadow-2xl " +
  "md:absolute md:inset-x-auto md:bottom-auto md:right-4 md:top-[132px] md:max-h-[78vh] md:w-[300px] md:rounded-xl";

const COLLAPSED =
  "fixed inset-x-4 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-20 flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-sand bg-white px-3.5 text-[13px] font-semibold text-forest shadow-[0_4px_20px_rgba(64,84,74,0.18)] " +
  "md:absolute md:inset-x-auto md:bottom-auto md:right-4 md:top-[132px] md:w-[300px]";

const OUTLINE_BTN =
  "mb-1.5 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-[10px] border-[1.5px] border-sand bg-white px-3 text-[13px] font-medium text-forest no-underline";

const ICON_BTN = "grid size-11 shrink-0 place-items-center text-muted";

// Multi-stop trip planner. Every entry (including "Your location") is a normal
// draggable stop — nothing is locked as start or end. "Nearby to add" always
// surfaces vendors near "Your location" (never the last stop) that aren't in
// the trip yet, one tap to add.
export default function TripPanel({
  trip, summary, loading,
  onReorder, onClear, onRemove, onEditStop,
  travelMode, onTravelMode,
  onManualLocation, onLocateMe,
  routeOptions, routeIndex, onSelectRoute,
  transitLegs,
  nearbyToAdd, onAddStop, onAddCustomStop, onSelectNearby,
  radiusKm, onRadiusChange, showAllVendors, onToggleAllVendors,
  hasAnchor,
  onSuggestBestOrder,
  collapsed, onToggleCollapsed,
}) {
  const [dragIdx, setDragIdx] = useState(null);
  const [showNav, setShowNav] = useState(false);
  const [editingId, setEditingId] = useState(null); // id of the stop whose address is being re-typed
  const [addingPlace, setAddingPlace] = useState(false);

  function handleDrop(i) {
    if (dragIdx === null || dragIdx === i) return;
    const next = [...trip];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(i, 0, moved);
    setDragIdx(null);
    onReorder(next);
  }

  const vendorStops = trip.filter((s) => !s.isMe);

  if (collapsed) {
    return (
      <button onClick={onToggleCollapsed} className={COLLAPSED}>
        <Navigation size={15} color={MAP_COLORS.terracotta} />
        {trip.length > 0 ? `${trip.length} ${trip.length === 1 ? "stop" : "stops"}` : "Your Trip"}
      </button>
    );
  }
  const activeMode = NAV_MODES.find((m) => m.mode === travelMode);
  const gmaps = buildGoogleMapsUrl(trip, travelMode);

  return (
    <div className={PANEL}>
      {/* Panel header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5 font-display text-base font-bold text-forest">
          <Navigation size={16} color={MAP_COLORS.terracotta} /> Your Trip
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {trip.length > 0 && (
            <span className="rounded-full bg-forest px-2.5 py-0.5 text-[11.5px] text-white">
              {trip.length} {trip.length === 1 ? "stop" : "stops"}
            </span>
          )}
          {onToggleCollapsed && (
            <button onClick={onToggleCollapsed} aria-label="Collapse trip panel" className={ICON_BTN}>
              <ChevronDown size={16} />
            </button>
          )}
        </div>
      </div>

      {trip.length > 0 && (
        <div className="mb-2.5 mt-1 text-[11px] text-muted">Drag stops to reorder</div>
      )}

      {/* Stop list — "Your location" is a normal draggable row too. Location and
          custom (typed) stops are editable via the pencil icon; vendor stops
          aren't (drag + remove only). */}
      {/* No origin yet. Without this row a user who denies geolocation has no
          path to a starting point at all — the map's GPS button is the only
          other entry point. */}
      {!trip.some((s) => s.isMe) && (
        <>
          <div className="mb-2 flex items-center gap-2 rounded-[10px] border border-dashed border-sand bg-chalk px-2.5 py-2">
            <MapPin size={14} color={MAP_COLORS.muted} className="shrink-0" />
            <span className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-ink">Set your starting point</div>
              <div className="text-[11px] text-muted">Type a place or use GPS</div>
            </span>
            <button
              onClick={() => setEditingId((id) => (id === "__me__" ? null : "__me__"))}
              aria-label="Type a starting address"
              className={ICON_BTN}
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => { setEditingId(null); onLocateMe?.(); }}
              aria-label="Use my current location"
              className="grid size-11 shrink-0 place-items-center text-success"
            >
              <LocateFixed size={14} />
            </button>
          </div>
          {editingId === "__me__" && (
            <div className="mb-2">
              <LocationInput
                placeholder="Search your address…"
                onSelect={(place) => { onManualLocation(place); setEditingId(null); }}
              />
            </div>
          )}
        </>
      )}
      {trip.length === 0 ? (
        <div className="py-2 text-[13px] text-muted">
          Tap a pin on the map or <strong>+ Add to Trip</strong> on a vendor card to build your route.
        </div>
      ) : (
        <ol className="m-0 list-none p-0">
          {trip.map((s, i) => {
            const editable = s.isMe || s.source === "custom";
            return (
              <li key={s.id}>
                <div
                  draggable
                  onDragStart={() => setDragIdx(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(i)}
                  className={[
                    "mb-1.5 flex cursor-grab items-center gap-2 rounded-[10px] border px-1.5 py-1.5",
                    dragIdx === i ? "bg-chalk" : s.isMe ? "bg-[#EAF6EE]" : "bg-transparent",
                    s.isMe ? "border-[#CDE9D6]" : "border-sand",
                  ].join(" ")}
                >
                  <GripVertical size={14} color={MAP_COLORS.muted} className="shrink-0" />
                  {/* Every row is numbered, including the origin — the row is
                      draggable, so an unnumbered dot in the middle of the list
                      would read as nonsense. */}
                  <span className={s.isMe
                    ? "flex size-4.5 shrink-0 items-center justify-center rounded-full bg-success text-[10.5px] text-white"
                    : "flex size-4.5 shrink-0 items-center justify-center rounded-full bg-forest text-[10.5px] text-white"}>{i + 1}</span>
                  {s.vendor && (
                    <img
                      src={placeholderImage(s.vendor)} alt=""
                      className="size-8.5 shrink-0 rounded-full object-cover"
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-ink">
                      {s.name}
                    </div>
                    {s.vendor && (
                      <div className="text-[11px] text-muted">
                        {[distanceLabel(s.vendor), priceLabel(s.vendor)].filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </span>
                  {editable && (
                    <button
                      onClick={() => setEditingId((id) => (id === s.id ? null : s.id))}
                      aria-label="Edit stop location"
                      className={ICON_BTN}
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                  <button
                    onClick={() => onRemove(s.id)}
                    aria-label="Remove stop"
                    className={ICON_BTN}
                  >
                    <X size={15} />
                  </button>
                </div>
                {editingId === s.id && (
                  <div className="mb-2">
                    <LocationInput
                      placeholder={s.isMe ? "Search your address…" : "Search a place…"}
                      onSelect={(place) => {
                        if (s.isMe) onManualLocation(place);
                        else onEditStop(s.id, place);
                        setEditingId(null);
                      }}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {/* Add an arbitrary typed place — not tied to a vendor listing */}
      {onAddCustomStop && (
        addingPlace ? (
          <LocationInput
            placeholder="Search a place to add…"
            onSelect={(place) => { onAddCustomStop(place); setAddingPlace(false); }}
          />
        ) : (
          <button
            onClick={() => setAddingPlace(true)}
            className="flex min-h-11 items-center gap-1.5 text-[12.5px] font-medium text-terracotta"
          >
            <Plus size={13} /> Add a place
          </button>
        )
      )}

      {/* Nearby to add — tap a row to preview it on the map, tap + to add it. */}
      {onRadiusChange && (
        <div className="mt-2.5 flex items-center gap-1.5">
          <span className="text-[10.5px] font-bold uppercase tracking-[0.8px] text-terracotta">
            Nearby to Add
          </span>
          <span className="flex-1" />
          {[1, 2, 5].map((km) => (
            <button
              key={km}
              onClick={() => onRadiusChange(km)}
              className={radiusKm === km
                ? "min-h-11 rounded-full border border-forest bg-forest px-2 text-[11px] text-white"
                : "min-h-11 rounded-full border border-sand px-2 text-[11px] text-muted"}
            >
              {km}km
            </button>
          ))}
        </div>
      )}
      {onToggleAllVendors && (
        <button
          onClick={onToggleAllVendors}
          aria-pressed={showAllVendors}
          className={showAllVendors
            ? "mt-1.5 flex min-h-11 items-center gap-1.5 text-[11.5px] text-forest"
            : "mt-1.5 flex min-h-11 items-center gap-1.5 text-[11.5px] text-muted"}
        >
          {showAllVendors ? <Eye size={13} /> : <EyeOff size={13} />}
          {showAllVendors ? "Showing vendors on map" : "Vendors hidden on map"}
        </button>
      )}
      {nearbyToAdd && nearbyToAdd.length > 0 && (
        <div className="mt-1.5">
          {nearbyToAdd.map((v) => (
            <div
              key={v.id}
              onClick={() => onSelectNearby?.(v)}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1.5"
            >
              <img src={placeholderImage(v)} alt="" className="size-7.5 shrink-0 rounded-full object-cover" />
              <span className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] text-ink">{v.name}</div>
                <div className="text-[11px] text-muted">{[distanceLabel(v), priceLabel(v)].filter(Boolean).join(" · ")}</div>
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onAddStop(v); }}
                aria-label={`Add ${v.name} to trip`}
                className="grid size-11 shrink-0 place-items-center text-terracotta"
              >
                <Plus size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
      {onRadiusChange && nearbyToAdd && nearbyToAdd.length === 0 && (
        <div className="mt-1.5 text-[11.5px] text-muted">
          {hasAnchor ? `Nothing within ${radiusKm}km — try a bigger radius.` : "Set your starting point to see nearby vendors."}
        </div>
      )}

      {loading && <div className="my-2.5 text-xs text-muted">Calculating route…</div>}

      {/* Route summary tiles */}
      {summary && !loading && (
        <div className="my-3 grid grid-cols-2 gap-2">
          <StatTile icon={<Route size={13} color={MAP_COLORS.terracotta} />} value={summary.distance} label="Total Distance" />
          <StatTile icon={<Clock size={13} color={MAP_COLORS.terracotta} />} value={summary.duration} label="Est. Duration" />
        </div>
      )}

      {vendorStops.length >= 2 && (
        <button onClick={onSuggestBestOrder} className={OUTLINE_BTN}>
          <Sparkles size={14} /> Suggest Best Order
        </button>
      )}

      {/* Nav mode grid */}
      {showNav && (
        <div className="my-2 grid grid-cols-2 gap-1.5">
          {NAV_MODES.map(({ mode, label, icon, color }) => {
            const active = travelMode === mode;
            return (
              <button
                key={mode}
                onClick={() => onTravelMode(active ? null : mode)}
                className={active
                  ? "flex min-h-11 flex-col items-center gap-0.5 rounded-lg border-[1.5px] px-1 py-2 text-[11px] text-white"
                  : "flex min-h-11 flex-col items-center gap-0.5 rounded-lg border-[1.5px] border-sand bg-chalk px-1 py-2 text-[11px] text-ink"}
                style={active ? { background: color, borderColor: color } : undefined}
              >
                <span className="text-xl">{icon}</span>
                {label}
              </button>
            );
          })}
        </div>
      )}

      {travelMode === "TRANSIT" && vendorStops.length >= 1 && <TransitDetails legs={transitLegs} />}
      {travelMode === "DRIVING" && vendorStops.length >= 1 && (
        <RouteOptions routes={routeOptions} selectedIndex={routeIndex} onSelect={onSelectRoute} />
      )}

      {/* Start Navigation — navy CTA */}
      <button
        onClick={() => setShowNav((v) => !v)}
        disabled={trip.length < 2}
        className={trip.length < 2
          ? "mt-1 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-[10px] bg-chalk px-3 text-sm font-semibold text-muted"
          : "mt-1 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-[10px] bg-forest px-3 text-sm font-semibold text-white"}
      >
        <Navigation size={15} />
        {activeMode ? `Navigating by ${activeMode.label}` : "Start Navigation"}
      </button>

      {/* Hands off to Google Maps for real turn-by-turn navigation — we don't
          build in-app navigation ourselves. */}
      {gmaps && (
        <a
          href={gmaps.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${OUTLINE_BTN} mb-0 mt-2`}
        >
          <ExternalLink size={14} /> Open in Google Maps
        </a>
      )}
      {gmaps?.truncated && (
        <div className="mt-1 text-center text-[10.5px] text-muted">
          Google Maps supports up to 9 stops after your start — the rest are left out.
        </div>
      )}

      {trip.length > 0 && (
        <button
          onClick={onClear}
          className="mt-2.5 block min-h-11 w-full text-center text-xs text-muted"
        >
          Clear stops
        </button>
      )}
    </div>
  );
}

function StatTile({ icon, value, label }) {
  return (
    <div className="rounded-[10px] bg-chalk px-2.5 py-2">
      <div className="mb-1">{icon}</div>
      <div className="text-sm font-semibold tabular-nums text-ink">{value}</div>
      <div className="text-[10.5px] text-muted">{label}</div>
    </div>
  );
}
