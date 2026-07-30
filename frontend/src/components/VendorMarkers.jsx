import { useEffect, useRef, useState, useCallback } from "react";
import {
  AdvancedMarker,
  Pin,
  InfoWindow,
  Circle,
  useMap,
} from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { C } from "../lib/theme";

// Renders vendor pins with clustering, plus numbered pins for trip stops and a
// "you are here" marker. Vendor data comes from Supabase: { id, name, address,
// latitude, longitude }.
export default function VendorMarkers({ vendors, userPos, onSelect, onAddStop, tripOrder, userStopNumber, selectedId, openId: openIdProp, onOpenChange, radiusCenter, radiusKm }) {
  const map = useMap();
  const [openIdState, setOpenIdState] = useState(null);
  const openId = onOpenChange ? openIdProp : openIdState;
  const setOpenId = onOpenChange || setOpenIdState;
  const clusterer = useRef(null);
  const markers = useRef({});

  useEffect(() => {
    if (document.getElementById("user-loc-marker-style")) return;
    const s = document.createElement("style");
    s.id = "user-loc-marker-style";
    s.textContent = `.user-loc-dot{width:14px;height:14px;border-radius:50%;background:#1d72e8;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(29,114,232,.4);animation:userPulse 2s ease-in-out infinite}.user-loc-dot-num{width:22px;height:22px;border-radius:50%;background:#1d72e8;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(29,114,232,.4);display:flex;align-items:center;justify-content:center;color:#fff;font:700 11px/1 system-ui,sans-serif;animation:userPulse 2s ease-in-out infinite}@keyframes userPulse{0%,100%{box-shadow:0 0 0 3px rgba(29,114,232,.35),0 2px 6px rgba(29,114,232,.3)}50%{box-shadow:0 0 0 11px rgba(29,114,232,0),0 2px 6px rgba(29,114,232,.3)}}`;
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (!map) return;
    if (!clusterer.current) clusterer.current = new MarkerClusterer({ map });
  }, [map]);

  useEffect(() => {
    if (!clusterer.current) return;
    clusterer.current.clearMarkers();
    clusterer.current.addMarkers(Object.values(markers.current));
  }, [vendors, tripOrder, selectedId]);

  // Trip stops and the selected pin carry meaning (their number, their red
  // highlight) that a cluster bubble would swallow — two nearby stops would
  // collapse into an anonymous "2" bubble instead of showing stop 2 and stop 3.
  // Keep those out of the clusterer entirely so they always render individually.
  const setMarkerRef = useCallback((marker, id, excludeFromCluster) => {
    if (marker && !excludeFromCluster) markers.current[id] = marker;
    else delete markers.current[id];
  }, []);

  // Trip stops that share the exact same coordinates (confirmed real case: two
  // vendors both geocoded to the same generic area centroid, e.g. no street
  // address available) would otherwise stack one pin exactly on top of the
  // other, hiding it completely. Nudge duplicates apart in a small circle so
  // every stop stays visible and clickable.
  const positionKey = (v) => `${v.latitude.toFixed(5)},${v.longitude.toFixed(5)}`;
  const tripStopGroups = {};
  vendors.forEach((v) => {
    if (!tripOrder?.has(v.id)) return;
    const key = positionKey(v);
    (tripStopGroups[key] ||= []).push(v.id);
  });
  const JITTER_DEG = 0.0013; // ~140m — visible apart at typical trip-viewing zoom, still negligible on the map
  const displayPosition = (v) => {
    const group = tripStopGroups[positionKey(v)];
    if (!group || group.length < 2) return { lat: v.latitude, lng: v.longitude };
    const idx = group.indexOf(v.id);
    const angle = (2 * Math.PI * idx) / group.length;
    return {
      lat: v.latitude + JITTER_DEG * Math.sin(angle),
      lng: v.longitude + JITTER_DEG * Math.cos(angle),
    };
  };

  return (
    <>
      {/* The radius the "Nearby to add" list and the vendor pins are filtered by.
          clickable={false} is load-bearing — at 10 km this covers the whole
          viewport and would otherwise swallow every pin click. */}
      {radiusCenter && radiusKm && (
        <Circle
          center={radiusCenter}
          radius={radiusKm * 1000}
          clickable={false}
          strokeColor={C.navy}
          strokeOpacity={0.5}
          strokeWeight={1.5}
          fillColor={C.navy}
          fillOpacity={0.06}
        />
      )}
      {vendors.map((v) => {
        const stopNum = tripOrder?.get(v.id);
        // AI-extracted vendors that only had a city/state (no street address) get
        // geocoded to a city centroid, not the real spot — flag them visually so
        // users don't mistake a fuzzy guess for a precise pin.
        const isApproximate = v.location_precision === "city_level" || v.location_precision === "unknown";
        const isSelected = v.id === selectedId;
        const pos = displayPosition(v);
        return (
          <div key={v.id}>
            {isApproximate && (
              <Circle
                center={pos}
                radius={800}
                strokeColor="#f5a623"
                strokeOpacity={0.5}
                strokeWeight={1}
                fillColor="#f5a623"
                fillOpacity={0.08}
              />
            )}
            <AdvancedMarker
              position={pos}
              ref={(marker) => setMarkerRef(marker, v.id, Boolean(stopNum) || isSelected)}
              onClick={() => { setOpenId(v.id); onSelect(v); }}
              zIndex={isSelected ? 999 : undefined}
            >
              <Pin
                background={isSelected ? C.danger : stopNum ? C.terracotta : isApproximate ? C.warning : C.success}
                glyphColor="#fff"
                borderColor="#fff"
                scale={isSelected ? 1.5 : 1}
                glyph={stopNum ? String(stopNum) : isSelected ? undefined : isApproximate ? "?" : ""}
              />
            </AdvancedMarker>
          </div>
        );
      })}

      {openId &&
        vendors
          .filter((v) => v.id === openId)
          .map((v) => (
            <InfoWindow
              key={v.id}
              position={displayPosition(v)}
              onCloseClick={() => setOpenId(null)}
            >
              <div style={{ fontFamily: "system-ui", maxWidth: 220 }}>
                <strong>{v.name}</strong>
                {v.address && <div style={{ fontSize: 12, color: "#555", margin: "2px 0" }}>{v.address}</div>}
                {(v.location_precision === "city_level" || v.location_precision === "unknown") && (
                  <div style={{ fontSize: 11, color: "#b35c00", margin: "2px 0" }}>
                    ⚠️ Approximate location — exact address not confirmed
                  </div>
                )}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${v.name} ${v.latitude},${v.longitude}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-block", marginTop: 8, padding: "6px 12px", background: C.navy, color: "#fff", borderRadius: 4, fontSize: 12, textDecoration: "none" }}
                >
                  View details ↗
                </a>
                {onAddStop && (
                  <button
                    onClick={() => onAddStop(v)}
                    disabled={tripOrder?.has(v.id)}
                    style={{
                      display: "inline-block", marginTop: 8, marginLeft: 6, padding: "6px 12px",
                      background: tripOrder?.has(v.id) ? "#eee" : C.success,
                      color: tripOrder?.has(v.id) ? "#777" : "#fff",
                      border: "none", borderRadius: 6, fontSize: 12,
                      cursor: tripOrder?.has(v.id) ? "default" : "pointer",
                    }}
                  >
                    {tripOrder?.has(v.id) ? `✓ Stop ${tripOrder.get(v.id)}` : "➕ Add stop"}
                  </button>
                )}
              </div>
            </InfoWindow>
          ))}

      {userPos && (
        <AdvancedMarker position={userPos} title="You are here">
          {userStopNumber
            ? <div className="user-loc-dot-num">{userStopNumber}</div>
            : <div className="user-loc-dot" />}
        </AdvancedMarker>
      )}
    </>
  );
}
