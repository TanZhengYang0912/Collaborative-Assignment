import { useEffect, useState } from "react";
import { APIProvider, Map as GMap, useMap } from "@vis.gl/react-google-maps";
import { getRestaurants, getTrip } from "../api";
import VendorMarkers from "../components/VendorMarkers";
import MelakaHighlight from "../components/MelakaHighlight";
import TripPanel from "../components/TripPanel";
import TripPolyline from "../components/TripPolyline";
import DirectionsRenderer from "../components/DirectionsRenderer";
import Dashboard from "../components/Dashboard";

const MELAKA_CENTER = { lat: 2.1896, lng: 102.2501 };
const API_KEY = import.meta.env.VITE_MAPS_BROWSER_KEY;
const MAP_ID = import.meta.env.VITE_MAP_ID || "DEMO_MAP_ID";

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function FocusOnVendor({ vendor }) {
  const map = useMap();
  useEffect(() => {
    if (map && vendor) {
      map.panTo({ lat: vendor.latitude, lng: vendor.longitude });
      map.setZoom(16);
    }
  }, [map, vendor]);
  return null;
}

function FocusOnUser({ pos }) {
  const map = useMap();
  useEffect(() => {
    if (map && pos) {
      map.panTo(pos);
      map.setZoom(14);
    }
  }, [map, pos]);
  return null;
}

export default function MapPage() {
  const [view, setView] = useState("dashboard");     // "dashboard" | "map"
  const [vendors, setVendors] = useState([]);
  const [bookmarks, setBookmarks] = useState(new Set());
  const [focusVendor, setFocusVendor] = useState(null);
  const [selected, setSelected] = useState(null);
  const [userPos, setUserPos] = useState(null);
  const [locateTarget, setLocateTarget] = useState(null);
  // "single" — entered map by picking one vendor from Dashboard, only show that
  // pin (plus anything already on the trip). "nearby" — entered via the Map tab,
  // show the 10 closest vendors to the user's current position.
  const [mapMode, setMapMode] = useState("single");
  const [nearbyVendors, setNearbyVendors] = useState([]);

  const [trip, setTrip] = useState([]);              // unified draggable stops
  const [tripData, setTripData] = useState(null);
  const [tripLoading, setTripLoading] = useState(false);
  const [travelMode, setTravelMode] = useState(null);   // null | "DRIVING" | "TWO_WHEELER" | "TRANSIT" | "WALKING"
  const [dirSummary, setDirSummary] = useState(null);
  const [isDark, setIsDark] = useState(false);

  // Load vendors (Supabase, sorted from Melaka centre as a default reference).
  useEffect(() => {
    getRestaurants(MELAKA_CENTER.lat, MELAKA_CENTER.lng)
      .then(setVendors)
      .catch((e) => console.error("failed to load vendors:", e.message));
  }, []);

  // Each stop is a normal draggable entry — the user's location too.
  const vendorStop = (v) => ({ id: v.id, name: v.name, lat: v.latitude, lng: v.longitude, isMe: false, vendor: v });
  const meStop = (pos) => ({ id: "__me__", name: "Your location", lat: pos.lat, lng: pos.lng, isMe: true });

  async function planTrip(list, optimize) {
    if (list.length < 2) { setTripData(null); return; }
    setTripLoading(true);
    try {
      const points = list.map((s) => ({ lat: s.lat, lng: s.lng }));
      const res = await getTrip(points, optimize);
      if (optimize) setTrip(res.order.map((i) => list[i]));
      setTripData({ path: res.path, distance: res.distance, duration: res.duration });
    } catch (e) {
      console.error(e);
      alert("Trip planning failed (free OSRM server may be busy). Try again.");
    } finally {
      setTripLoading(false);
    }
  }

  useEffect(() => {
    if (!userPos || trip.length === 0) return;
    const hasMe = trip.some((s) => s.isMe);
    const next = hasMe
      ? trip.map((s) => (s.isMe ? { ...s, lat: userPos.lat, lng: userPos.lng } : s))
      : [meStop(userPos), ...trip];
    setTrip(next);
    planTrip(next, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPos]);

  function addStop(vendor) {
    if (trip.some((s) => s.id === vendor.id)) return;
    const list = [...trip, vendorStop(vendor)];
    setTrip(list);
    planTrip(list, true);
  }
  function reorderTrip(newList) { setTrip(newList); planTrip(newList, false); }
  function removeStop(id) { const list = trip.filter((s) => s.id !== id); setTrip(list); planTrip(list, false); }
  function clearTrip() { setTrip([]); setTripData(null); setTravelMode(null); setDirSummary(null); }

  function toggleBookmark(id) {
    setBookmarks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // silent=true only records the position (needed to add "Your location" as a
  // trip stop) without moving the camera — used when locating happens as a
  // side effect of picking a vendor, so it doesn't hijack that vendor's focus
  // once geolocation resolves a moment later.
  function locateMe(silent = false) {
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const pos = { lat: p.coords.latitude, lng: p.coords.longitude };
        setUserPos(pos);
        if (!silent) setLocateTarget(pos);
      },
      () => {
        setUserPos(MELAKA_CENTER);
        if (!silent) setLocateTarget(MELAKA_CENTER);
      }
    );
  }

  function openVendorOnMap(vendor) {
    setMapMode("single");
    setFocusVendor(vendor);
    setSelected(vendor);
    setView("map");
    let list = trip.some((s) => s.id === vendor.id) ? [...trip] : [...trip, vendorStop(vendor)];
    if (userPos && !list.some((s) => s.isMe)) list = [meStop(userPos), ...list];
    setTrip(list);
    if (!userPos) locateMe(true);
    else planTrip(list, true);
  }

  // Entry point for the Dashboard's "Map" tab — jumps straight into the map,
  // centred on the user, showing just the 10 nearest vendors instead of every
  // pin at once.
  function openMapNearby() {
    const focusOn = (pos) => {
      setUserPos(pos);
      setLocateTarget(pos);
      setMapMode("nearby");
      setFocusVendor(null);
      setSelected(null);
      setView("map");
      const nearest = vendors
        .filter((v) => v.latitude != null && v.longitude != null)
        .map((v) => ({ ...v, _distFromMe: haversineKm(pos.lat, pos.lng, v.latitude, v.longitude) }))
        .sort((a, b) => a._distFromMe - b._distFromMe)
        .slice(0, 10);
      setNearbyVendors(nearest);
    };
    if (userPos) { focusOn(userPos); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => focusOn({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => focusOn(MELAKA_CENTER)
    );
  }

  if (!API_KEY) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui" }}>
        <h2>Missing browser API key</h2>
        <p>Set <code>VITE_MAPS_BROWSER_KEY</code> in <code>frontend/.env</code>, then restart the dev server.</p>
      </div>
    );
  }

  if (view === "dashboard") {
    return (
      <Dashboard
        vendors={vendors}
        bookmarks={bookmarks}
        onToggleBookmark={toggleBookmark}
        onOpenVendor={openVendorOnMap}
        onOpenMap={openMapNearby}
      />
    );
  }

  const meIndex = trip.findIndex((s) => s.isMe);
  const vendorStopOrder = new Map();
  trip.forEach((s, i) => { if (!s.isMe) vendorStopOrder.set(s.id, i + 1); });

  // Only render every pin when the user is actively browsing "all" — otherwise
  // stick to what they came here to see (one vendor, or their nearest 10),
  // plus anything they've already added as a trip stop.
  const visibleVendors = mapMode === "nearby"
    ? nearbyVendors
    : vendors.filter((v) => v.id === focusVendor?.id || vendorStopOrder.has(v.id));

  return (
    <APIProvider apiKey={API_KEY} libraries={["geometry", "marker"]}>
      <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
        <GMap
          defaultCenter={MELAKA_CENTER}
          defaultZoom={13}
          mapId={MAP_ID}
          colorScheme={isDark ? "DARK" : "LIGHT"}
          gestureHandling="greedy"
          style={{ width: "100%", height: "100%" }}
        >
          <MelakaHighlight />
          {/* FocusOnUser must commit before FocusOnVendor — React runs effects in
              JSX order, and picking a vendor often triggers a first-time
              locateMe() call in the same update. Without this order, "focus on
              me" would win and undo the "focus on the vendor I picked" zoom. */}
          <FocusOnUser pos={locateTarget} />
          <FocusOnVendor vendor={focusVendor} />
          <VendorMarkers
            vendors={visibleVendors}
            userPos={userPos}
            onSelect={setSelected}
            onAddStop={addStop}
            tripOrder={vendorStopOrder}
            userStopNumber={meIndex >= 0 ? meIndex + 1 : null}
            selectedId={selected?.id}
          />
          {travelMode
            ? <DirectionsRenderer stops={trip} travelMode={travelMode} onSummary={setDirSummary} />
            : tripData?.path && <TripPolyline path={tripData.path} />
          }
        </GMap>

        <button
          onClick={() => setView("dashboard")}
          style={{ position: "absolute", top: 60, right: 16, zIndex: 10, background: "#fff", border: "1px solid #EADBCB", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: "system-ui", fontSize: 14, color: "#993C1D", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
        >
          ← Back to vendors
        </button>

        <button
          onClick={() => setIsDark((v) => !v)}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          style={{
            position: "absolute", top: 90, left: 10, zIndex: 10,
            background: isDark ? "#1f1f1f" : "#fff",
            border: `1px solid ${isDark ? "#444" : "#ccc"}`,
            borderRadius: 6, padding: "4px 10px",
            cursor: "pointer", fontFamily: "system-ui", fontSize: 12,
            color: isDark ? "#fff" : "#333",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            display: "flex", alignItems: "center", gap: 5,
          }}
        >
          {isDark ? "☀️ Light" : "🌙 Dark"}
        </button>

        <button
          onClick={() => planTrip(trip, true)}
          disabled={trip.length < 2}
          title={trip.length < 2 ? "Add at least 2 stops to your trip first" : "Reorder stops for the shortest overall trip"}
          style={{
            position: "absolute", top: 130, left: 10, zIndex: 10,
            background: trip.length < 2 ? "#eee" : "#D85A30",
            color: trip.length < 2 ? "#999" : "#fff",
            border: "none",
            borderRadius: 6, padding: "6px 12px",
            cursor: trip.length < 2 ? "not-allowed" : "pointer",
            fontFamily: "system-ui", fontSize: 12, fontWeight: 500,
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          }}
        >
          ↺ Suggest best order
        </button>

        <button
          onClick={locateMe}
          title="Get current location"
          style={{ position: "absolute", bottom: 180, right: 10, zIndex: 10, background: "#fff", border: "1px solid #EADBCB", borderRadius: 8, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.18)", fontSize: 18 }}
        >
          📍
        </button>

        <TripPanel
          trip={trip}
          summary={travelMode ? dirSummary : tripData}
          loading={tripLoading}
          onReorder={reorderTrip}
          onClear={clearTrip}
          onRemove={removeStop}
          travelMode={travelMode}
          onTravelMode={setTravelMode}
        />
      </div>
    </APIProvider>
  );
}
