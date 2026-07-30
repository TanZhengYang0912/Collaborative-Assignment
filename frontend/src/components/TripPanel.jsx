import { useState } from "react";
import { Navigation, GripVertical, X, Pencil, Sparkles, Route, Clock, Plus, ExternalLink, ChevronDown, MapPin, LocateFixed } from "lucide-react";
import LocationInput from "./LocationInput";
import TransitDetails from "./TransitDetails";
import RouteOptions from "./RouteOptions";
import { C, FONT_DISPLAY, FONT_BODY } from "../lib/theme";
import { placeholderImage, priceLabel, distanceLabel } from "../lib/vendorDisplay";
import { buildGoogleMapsUrl } from "../lib/googleMapsHandoff";

const NAV_MODES = [
  { mode: "DRIVING",     label: "Car",        icon: "🚗",  color: "#1d72e8" },
  { mode: "TWO_WHEELER", label: "Motorcycle", icon: "🏍️", color: "#e87c1d" },
  { mode: "TRANSIT",     label: "Transit",    icon: "🚌",  color: "#1da84b" },
  { mode: "WALKING",     label: "Walking",    icon: "🚶",  color: "#8e44ad" },
];

const panel = {
  position: "absolute",
  top: 132,
  right: 16,
  width: 300,
  maxHeight: "78vh",
  overflowY: "auto",
  background: C.card,
  borderRadius: 14,
  boxShadow: "0 4px 20px rgba(27,42,74,0.18)",
  padding: 16,
  fontFamily: FONT_BODY,
  zIndex: 10,
};

// Multi-stop trip planner. Every entry (including "Your location") is a normal
// draggable stop — nothing is locked as start or end. "Nearby to add" surfaces
// vendors close to the last stop that aren't in the trip yet, one tap to add.
export default function TripPanel({
  trip, summary, loading,
  onReorder, onClear, onRemove, onEditStop,
  travelMode, onTravelMode,
  onManualLocation, onLocateMe,
  routeOptions, routeIndex, onSelectRoute,
  transitLegs,
  nearbyToAdd, onAddStop, onAddCustomStop, onSelectNearby,
  radiusKm, onRadiusChange,
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
      <button
        onClick={onToggleCollapsed}
        style={{
          position: "absolute", top: 132, right: 16, zIndex: 10,
          display: "flex", alignItems: "center", gap: 6,
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
          padding: "10px 14px", cursor: "pointer", boxShadow: "0 4px 20px rgba(27,42,74,0.18)",
          fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: C.navy,
        }}
      >
        <Navigation size={15} color={C.gold} />
        {trip.length > 0 ? `${trip.length} ${trip.length === 1 ? "stop" : "stops"}` : "Your Trip"}
      </button>
    );
  }
  const activeMode = NAV_MODES.find((m) => m.mode === travelMode);
  const gmaps = buildGoogleMapsUrl(trip, travelMode);

  return (
    <div style={panel}>
      {/* Panel header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16, color: C.navy,
        }}>
          <Navigation size={16} color={C.gold} /> Your Trip
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {trip.length > 0 && (
            <span style={{
              background: C.navy, color: "#fff", fontSize: 11.5,
              padding: "3px 9px", borderRadius: 20,
            }}>
              {trip.length} {trip.length === 1 ? "stop" : "stops"}
            </span>
          )}
          {onToggleCollapsed && (
            <button
              onClick={onToggleCollapsed}
              aria-label="Collapse trip panel"
              style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex" }}
            >
              <ChevronDown size={16} />
            </button>
          )}
        </div>
      </div>

      {trip.length > 0 && (
        <div style={{ fontSize: 11, color: C.muted, margin: "4px 0 10px" }}>
          Drag stops to reorder
        </div>
      )}

      {/* Stop list — "Your location" is a normal draggable row too. Location and
          custom (typed) stops are editable via the pencil icon; vendor stops
          aren't (drag + remove only). */}
      {/* No origin yet. Without this row a user who denies geolocation has no
          path to a starting point at all — the map's GPS button is the only
          other entry point. */}
      {!trip.some((s) => s.isMe) && (
        <>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", marginBottom: 8,
            border: `1px dashed ${C.border}`, borderRadius: 10, background: C.cream,
          }}>
            <MapPin size={14} color={C.muted} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>Set your starting point</div>
              <div style={{ fontSize: 11, color: C.muted }}>Type a place or use GPS</div>
            </span>
            <button
              onClick={() => setEditingId((id) => (id === "__me__" ? null : "__me__"))}
              aria-label="Type a starting address"
              style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, flexShrink: 0, display: "flex" }}
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => { setEditingId(null); onLocateMe?.(); }}
              aria-label="Use my current location"
              style={{ background: "none", border: "none", cursor: "pointer", color: C.success, flexShrink: 0, display: "flex" }}
            >
              <LocateFixed size={14} />
            </button>
          </div>
          {editingId === "__me__" && (
            <div style={{ marginBottom: 8 }}>
              <LocationInput
                placeholder="Search your address…"
                onSelect={(place) => { onManualLocation(place); setEditingId(null); }}
              />
            </div>
          )}
        </>
      )}
      {trip.length === 0 ? (
        <div style={{ fontSize: 13, color: C.muted, padding: "8px 0" }}>
          Tap a pin on the map or <strong>+ Add to Trip</strong> on a vendor card to build your route.
        </div>
      ) : (
        <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {trip.map((s, i) => {
            const editable = s.isMe || s.source === "custom";
            return (
              <li key={s.id}>
                <div
                  draggable
                  onDragStart={() => setDragIdx(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(i)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "7px 6px", marginBottom: editingId === s.id ? 4 : 6,
                    background: dragIdx === i ? C.cream : s.isMe ? "#EAF6EE" : "transparent",
                    border: `1px solid ${s.isMe ? "#CDE9D6" : C.border}`, borderRadius: 10,
                    cursor: "grab",
                  }}
                >
                  <GripVertical size={14} color={C.muted} style={{ flexShrink: 0 }} />
                  {s.isMe ? (
                    <span style={{ width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#2a9d8f" }} />
                    </span>
                  ) : (
                    <span style={{
                      width: 18, height: 18, borderRadius: "50%", background: C.navy, color: "#fff",
                      fontSize: 10.5, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>{i + 1}</span>
                  )}
                  {s.vendor && (
                    <img
                      src={placeholderImage(s.vendor)} alt=""
                      style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                    />
                  )}
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: C.text, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {s.name}
                    </div>
                    {s.vendor && (
                      <div style={{ fontSize: 11, color: C.muted }}>
                        {[distanceLabel(s.vendor), priceLabel(s.vendor)].filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </span>
                  {editable && (
                    <button
                      onClick={() => setEditingId((id) => (id === s.id ? null : s.id))}
                      aria-label="Edit stop location"
                      style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, flexShrink: 0, display: "flex" }}
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                  <button
                    onClick={() => onRemove(s.id)}
                    aria-label="Remove stop"
                    style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, flexShrink: 0, display: "flex" }}
                  >
                    <X size={15} />
                  </button>
                </div>
                {editingId === s.id && (
                  <div style={{ marginBottom: 8 }}>
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
            style={{
              display: "flex", alignItems: "center", gap: 5, background: "none", border: "none",
              cursor: "pointer", color: C.gold, fontSize: 12.5, fontWeight: 500, fontFamily: FONT_BODY,
              padding: "2px 0 8px",
            }}
          >
            <Plus size={13} /> Add a place
          </button>
        )
      )}

      {/* Nearby to add — tap a row to preview it on the map, tap + to add it. */}
      {onRadiusChange && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8, color: C.gold, textTransform: "uppercase" }}>
            Nearby to Add
          </span>
          <span style={{ flex: 1 }} />
          {[2, 5, 10].map((km) => (
            <button
              key={km}
              onClick={() => onRadiusChange(km)}
              style={{
                fontSize: 11, padding: "2px 8px", borderRadius: 20, cursor: "pointer",
                background: radiusKm === km ? C.navy : "transparent",
                color: radiusKm === km ? "#fff" : C.muted,
                border: `1px solid ${radiusKm === km ? C.navy : C.border}`,
              }}
            >
              {km}km
            </button>
          ))}
        </div>
      )}
      {nearbyToAdd && nearbyToAdd.length > 0 && (
        <div style={{ marginTop: 6 }}>
          {nearbyToAdd.map((v) => (
            <div
              key={v.id}
              onClick={() => onSelectNearby?.(v)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", cursor: "pointer", borderRadius: 8 }}
            >
              <img src={placeholderImage(v)} alt="" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{[distanceLabel(v), priceLabel(v)].filter(Boolean).join(" · ")}</div>
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onAddStop(v); }}
                aria-label={`Add ${v.name} to trip`}
                style={{ background: "none", border: "none", cursor: "pointer", color: C.gold, flexShrink: 0, display: "flex" }}
              >
                <Plus size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
      {onRadiusChange && nearbyToAdd && nearbyToAdd.length === 0 && (
        <div style={{ fontSize: 11.5, color: C.muted, marginTop: 6 }}>Nothing within {radiusKm}km — try a bigger radius.</div>
      )}

      {loading && <div style={{ fontSize: 12, color: C.muted, margin: "10px 0" }}>Calculating route…</div>}

      {/* Route summary tiles */}
      {summary && !loading && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "12px 0" }}>
          <StatTile icon={<Route size={13} color={C.gold} />} value={summary.distance} label="Total Distance" />
          <StatTile icon={<Clock size={13} color={C.gold} />} value={summary.duration} label="Est. Duration" />
        </div>
      )}

      {vendorStops.length >= 2 && (
        <button onClick={onSuggestBestOrder} style={outlineBtn}>
          <Sparkles size={14} /> Suggest Best Order
        </button>
      )}

      {/* Nav mode grid */}
      {showNav && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, margin: "8px 0" }}>
          {NAV_MODES.map(({ mode, label, icon, color }) => {
            const active = travelMode === mode;
            return (
              <button
                key={mode}
                onClick={() => onTravelMode(active ? null : mode)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  padding: "8px 4px", borderRadius: 8, fontSize: 11, gap: 3,
                  background: active ? color : C.cream,
                  color: active ? "#fff" : C.text,
                  border: `1.5px solid ${active ? color : C.border}`,
                  cursor: "pointer", fontFamily: FONT_BODY,
                }}
              >
                <span style={{ fontSize: 20 }}>{icon}</span>
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
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          width: "100%", boxSizing: "border-box", padding: "11px 12px", marginTop: 4,
          border: "none", borderRadius: 10, cursor: trip.length < 2 ? "default" : "pointer",
          fontSize: 14, fontWeight: 600, fontFamily: FONT_BODY,
          background: trip.length < 2 ? C.cream : C.navy,
          color: trip.length < 2 ? C.muted : "#fff",
          transition: "all 0.15s ease",
        }}
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
          style={{ ...outlineBtn, marginTop: 8, marginBottom: 0, textDecoration: "none" }}
        >
          <ExternalLink size={14} /> Open in Google Maps
        </a>
      )}
      {gmaps?.truncated && (
        <div style={{ fontSize: 10.5, color: C.muted, textAlign: "center", marginTop: 4 }}>
          Google Maps supports up to 9 stops after your start — the rest are left out.
        </div>
      )}

      {trip.length > 0 && (
        <button
          onClick={onClear}
          style={{
            display: "block", width: "100%", background: "none", border: "none",
            cursor: "pointer", color: C.muted, fontSize: 12, marginTop: 10, textAlign: "center",
          }}
        >
          Clear stops
        </button>
      )}
    </div>
  );
}

const outlineBtn = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  width: "100%", boxSizing: "border-box", padding: "9px 12px", marginBottom: 6,
  borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: FONT_BODY,
  background: "#fff", color: C.navy, border: `1.5px solid ${C.border}`,
};

function StatTile({ icon, value, label }) {
  return (
    <div style={{ background: C.cream, borderRadius: 10, padding: "9px 10px" }}>
      <div style={{ marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.text, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: 10.5, color: C.muted }}>{label}</div>
    </div>
  );
}
