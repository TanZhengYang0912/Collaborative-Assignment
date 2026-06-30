import { useEffect, useRef, useState, useCallback } from "react";
import {
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";

// Renders vendor pins with CLUSTERING (the "keep the interface clean" item in
// your Map Visualization spec) plus a blue "you are here" marker.
export default function VendorMarkers({ vendors, userPos, onSelect }) {
  const map = useMap();
  const [openId, setOpenId] = useState(null);     // which info window is open
  const clusterer = useRef(null);
  const markers = useRef({});                     // { vendorId: markerDOMNode }

  // Create the clusterer once the map exists
  useEffect(() => {
    if (!map) return;
    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({ map });
    }
  }, [map]);

  // Whenever the set of markers changes, re-feed them to the clusterer
  useEffect(() => {
    if (!clusterer.current) return;
    clusterer.current.clearMarkers();
    clusterer.current.addMarkers(Object.values(markers.current));
  }, [vendors]);

  // Called by each AdvancedMarker to register/unregister its DOM node
  const setMarkerRef = useCallback((marker, id) => {
    if (marker) markers.current[id] = marker;
    else delete markers.current[id];
  }, []);

  return (
    <>
      {vendors.map((v) => (
        <AdvancedMarker
          key={v.id}
          position={{ lat: v.latitude, lng: v.longitude }}
          ref={(marker) => setMarkerRef(marker, v.id)}
          onClick={() => {
            setOpenId(v.id);
            onSelect(v);
          }}
        >
          {/* Greener pin = higher Hidden Gem Score (your fairness story made visible) */}
          <Pin
            background={v.hiddenGemScore >= 85 ? "#2a9d8f" : "#e63946"}
            glyphColor="#fff"
            borderColor="#fff"
          />
        </AdvancedMarker>
      ))}

      {openId &&
        vendors
          .filter((v) => v.id === openId)
          .map((v) => (
            <InfoWindow
              key={v.id}
              position={{ lat: v.latitude, lng: v.longitude }}
              onCloseClick={() => setOpenId(null)}
            >
              <div style={{ fontFamily: "system-ui", maxWidth: 200 }}>
                <strong>{v.name}</strong>
                <div style={{ fontSize: 12, color: "#555" }}>{v.cuisine}</div>
                <div style={{ fontSize: 12, margin: "4px 0" }}>🍽 {v.signatureDish}</div>
                <div style={{ fontSize: 12 }}>💎 Hidden Gem Score: {v.hiddenGemScore}</div>
              </div>
            </InfoWindow>
          ))}

      {userPos && (
        <AdvancedMarker position={userPos} title="You are here">
          <Pin background="#1d72e8" glyphColor="#fff" borderColor="#fff" />
        </AdvancedMarker>
      )}
    </>
  );
}
