import { useEffect, useRef, useState, useCallback } from "react";
import {
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";

// Renders vendor pins with clustering, plus numbered pins for trip stops and a
// "you are here" marker. Vendor data comes from Supabase: { id, name, address,
// latitude, longitude }.
export default function VendorMarkers({ vendors, userPos, onSelect, onAddStop, tripOrder, userStopNumber }) {
  const map = useMap();
  const [openId, setOpenId] = useState(null);
  const clusterer = useRef(null);
  const markers = useRef({});

  useEffect(() => {
    if (!map) return;
    if (!clusterer.current) clusterer.current = new MarkerClusterer({ map });
  }, [map]);

  useEffect(() => {
    if (!clusterer.current) return;
    clusterer.current.clearMarkers();
    clusterer.current.addMarkers(Object.values(markers.current));
  }, [vendors]);

  const setMarkerRef = useCallback((marker, id) => {
    if (marker) markers.current[id] = marker;
    else delete markers.current[id];
  }, []);

  return (
    <>
      {vendors.map((v) => {
        const stopNum = tripOrder?.get(v.id);
        return (
          <AdvancedMarker
            key={v.id}
            position={{ lat: v.latitude, lng: v.longitude }}
            ref={(marker) => setMarkerRef(marker, v.id)}
            onClick={() => { setOpenId(v.id); onSelect(v); }}
          >
            {/* In a trip → orange pin with its stop number; otherwise a food pin */}
            <Pin
              background={stopNum ? "#D85A30" : "#2a9d8f"}
              glyphColor="#fff"
              borderColor="#fff"
              glyph={stopNum ? String(stopNum) : "🍜"}
            />
          </AdvancedMarker>
        );
      })}

      {openId &&
        vendors
          .filter((v) => v.id === openId)
          .map((v) => (
            <InfoWindow
              key={v.id}
              position={{ lat: v.latitude, lng: v.longitude }}
              onCloseClick={() => setOpenId(null)}
            >
              <div style={{ fontFamily: "system-ui", maxWidth: 220 }}>
                <strong>{v.name}</strong>
                {v.address && <div style={{ fontSize: 12, color: "#555", margin: "2px 0" }}>{v.address}</div>}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${v.name} ${v.latitude},${v.longitude}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-block", marginTop: 8, padding: "6px 12px", background: "#D85A30", color: "#fff", borderRadius: 6, fontSize: 12, textDecoration: "none" }}
                >
                  View details ↗
                </a>
                {onAddStop && (
                  <button
                    onClick={() => onAddStop(v)}
                    disabled={tripOrder?.has(v.id)}
                    style={{
                      display: "inline-block", marginTop: 8, marginLeft: 6, padding: "6px 12px",
                      background: tripOrder?.has(v.id) ? "#eee" : "#2a9d8f",
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
          <Pin
            background="#1d72e8"
            glyphColor="#fff"
            borderColor="#fff"
            glyph={userStopNumber ? String(userStopNumber) : "🧍"}
          />
        </AdvancedMarker>
      )}
    </>
  );
}
