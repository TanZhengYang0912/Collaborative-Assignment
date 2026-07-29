import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { APIProvider, Map as GMap, useMap } from "@vis.gl/react-google-maps";
import { getRestaurants, getTrip } from "../api";
import { supabase } from "../supabaseClient";
import { getBookmarks, getFolders, addBookmark, removeBookmark, createFolder } from "../api/engagement";
import VendorMarkers from "../components/VendorMarkers";
import MelakaHighlight from "../components/MelakaHighlight";
import TripPanel from "../components/TripPanel";
import TripPolyline from "../components/TripPolyline";
import DirectionsRenderer from "../components/DirectionsRenderer";
import TransitLayer from "../components/TransitLayer";
import Dashboard from "../components/Dashboard";
import FolderPickerModal from "../components/engagement/FolderPickerModal";
import Toast from "../components/engagement/Toast";
import { useToast, sleep } from "../lib/useToast";
import { ENGAGEMENT_TEST_MODE } from "../lib/testMode";
import { loadTrip, saveTrip } from "../lib/tripStorage";
import { C } from "../lib/theme";

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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState(() => searchParams.get("view") === "map" ? "map" : "dashboard");     // "dashboard" | "map"
  const [vendors, setVendors] = useState([]);
  const [session, setSession] = useState(null);
  const [bookmarkRows, setBookmarkRows] = useState([]); // {vendor_id, folder_id, folder} from the server
  const [folders, setFolders] = useState([]);
  const [pendingSaveVendor, setPendingSaveVendor] = useState(null); // vendor awaiting a folder pick
  const bookmarks = new Set(bookmarkRows.map((r) => r.vendor_id));
  const [focusVendor, setFocusVendor] = useState(null);
  const [selected, setSelected] = useState(null);
  const [userPos, setUserPos] = useState(null);
  const [locateTarget, setLocateTarget] = useState(null);
  // "single" — entered map by picking one vendor from Dashboard, only show that
  // pin (plus anything already on the trip). "nearby" — entered via the Map tab,
  // show the 10 closest vendors to the user's current position.
  const [mapMode, setMapMode] = useState("single");
  const [nearbyVendors, setNearbyVendors] = useState([]);

  // Trip planning is unauthenticated, browser-local state — restored from
  // localStorage on mount (see lib/tripStorage.js) so a reload doesn't lose it.
  const [trip, setTrip] = useState(() => loadTrip()?.stops || []);              // unified draggable stops
  const [tripData, setTripData] = useState(null);
  const [tripLoading, setTripLoading] = useState(false);
  const [travelMode, setTravelMode] = useState(() => loadTrip()?.travelMode || null);   // null | "DRIVING" | "TWO_WHEELER" | "TRANSIT" | "WALKING"
  const [dirSummary, setDirSummary] = useState(null);
  const [routeIndex, setRouteIndex] = useState(0);       // selected alt route (DRIVING)
  const [routeOptions, setRouteOptions] = useState([]);  // alt routes + toll flags (DRIVING)
  const [transitLegs, setTransitLegs] = useState([]);    // itinerary legs (TRANSIT)
  const [isDark, setIsDark] = useState(false);
  const [toast, notify] = useToast();

  // Load vendors (Supabase, sorted from Melaka centre as a default reference).
  useEffect(() => {
    getRestaurants(MELAKA_CENTER.lat, MELAKA_CENTER.lng)
      .then(setVendors)
      .catch((e) => { console.error("failed to load vendors:", e.message); notify("Couldn't load vendors. Check your connection and try again.", true); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist the trip on every change (id/name/lat/lng/isMe/source only — see
  // lib/tripStorage.js for why the embedded `vendor` snapshot isn't saved).
  useEffect(() => { saveTrip(trip, travelMode); }, [trip, travelMode]);

  // A trip restored from storage carries vendor stops with no `vendor` object
  // (it's never persisted). Re-attach it by id once the vendor list loads.
  useEffect(() => {
    if (!vendors.length) return;
    setTrip((current) => {
      let changed = false;
      const next = current.map((s) => {
        if (s.isMe || s.vendor) return s;
        const v = vendors.find((vv) => vv.id === s.id);
        if (!v) return s;
        changed = true;
        return { ...s, vendor: v };
      });
      return changed ? next : current;
    });
  }, [vendors]);

  // Recompute the route for a trip restored from storage — path/distance/
  // duration are never persisted (they're cheap to recompute and would
  // otherwise go stale). Runs once; DirectionsRenderer already handles this
  // reactively when a travelMode was also restored.
  useEffect(() => {
    if (trip.length >= 2 && !travelMode) planTrip(trip, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  // Bookmarks are server-backed and auth-gated — an anonymous browser sees
  // none, and any local state is dropped the moment the session disappears.
  useEffect(() => {
    if (!session && !ENGAGEMENT_TEST_MODE) { setBookmarkRows([]); setFolders([]); return; }
    refreshBookmarks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  function refreshBookmarks() {
    getFolders().then((f) => setFolders(f.folders)).catch((e) => console.error("failed to load folders:", e.message));
    getBookmarks().then((b) => setBookmarkRows(b.bookmarks)).catch((e) => console.error("failed to load bookmarks:", e.message));
  }

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
      notify("Trip planning failed (the free routing server may be busy). Please try again.", true);
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
    notify(`${vendor.name} added to your trip.`);
  }
  // A typed place (not a vendor) — e.g. "pick up a friend on the way".
  function addCustomStop(place) {
    const stop = { id: `custom-${Date.now()}`, name: place.label, lat: place.lat, lng: place.lng, isMe: false, source: "custom" };
    const list = [...trip, stop];
    setTrip(list);
    planTrip(list, true);
    notify(`${place.label} added to your trip.`);
  }
  function reorderTrip(newList) { setTrip(newList); planTrip(newList, false); }
  function removeStop(id) { const list = trip.filter((s) => s.id !== id); setTrip(list); planTrip(list, false); }

  // Keeps "Your location" and the chosen transport mode — only the vendor
  // stops (the actual destinations) are cleared, so the user can immediately
  // start building a new trip from where they are without resetting mode/GPS.
  function clearTrip() {
    const list = trip.filter((s) => s.isMe);
    setTrip(list);
    setTripData(null);
    setDirSummary(null);
    setRouteOptions([]);
    setTransitLegs([]);
  }

  // Manual start location typed via Places Autocomplete — same effect as
  // geolocation resolving, just fed a chosen address instead of GPS.
  function setManualLocation(pos) {
    setUserPos(pos);
    setLocateTarget(pos);
  }

  // A previously-picked alt route index shouldn't survive a mode switch or a
  // fresh route recalculation — always default back to Google's top pick.
  useEffect(() => { setRouteIndex(0); }, [travelMode, trip]);

  // Un-saving is a plain delete; saving opens the folder picker (rendered by
  // each view below) so the vendor lands somewhere the user chose.
  function toggleBookmark(id) {
    if (!session && !ENGAGEMENT_TEST_MODE) { navigate("/login"); return; }
    if (bookmarks.has(id)) {
      removeBookmark(id)
        .then(() => { refreshBookmarks(); notify("Vendor removed from bookmarks."); })
        .catch((e) => notify(e.message, true));
      return;
    }
    const vendor = vendors.find((v) => v.id === id) || nearbyVendors.find((v) => v.id === id);
    setPendingSaveVendor(vendor || { id });
  }

  async function confirmSaveBookmark(folderId) {
    await addBookmark(pendingSaveVendor.id, folderId);
    setPendingSaveVendor(null);
    refreshBookmarks();
    notify("Vendor bookmarked!");
  }

  async function createFolderAndSave(name) {
    const { folder } = await createFolder(name);
    notify("Folder created successfully!");
    refreshBookmarks();
    await sleep(1200);
    await confirmSaveBookmark(folder.id);
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
        if (!silent) {
          setLocateTarget(MELAKA_CENTER);
          notify("Couldn't get your location — showing Melaka centre instead.", true);
        }
      }
    );
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
      () => { focusOn(MELAKA_CENTER); notify("Couldn't get your location — showing vendors near Melaka centre.", true); }
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
      <>
        <Dashboard
          vendors={vendors}
          bookmarks={bookmarks}
          onToggleBookmark={toggleBookmark}
          onOpenMap={openMapNearby}
          tripVendorIds={new Set(trip.filter((s) => !s.isMe).map((s) => s.id))}
          onAddStop={addStop}
        />
        {pendingSaveVendor && (
          <FolderPickerModal
            vendorName={pendingSaveVendor.name}
            folders={folders}
            onClose={() => setPendingSaveVendor(null)}
            onSave={confirmSaveBookmark}
            onCreateFolder={createFolderAndSave}
          />
        )}
        <Toast toast={toast} />
      </>
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

  // "Nearby to add" in the trip panel — vendors not already in the trip,
  // closest to the last stop (or the user, if there's no trip yet).
  const nearbyToAdd = (() => {
    const anchor = trip[trip.length - 1] || (userPos ? { lat: userPos.lat, lng: userPos.lng } : null);
    if (!anchor) return [];
    return vendors
      .filter((v) => v.latitude != null && !trip.some((s) => s.id === v.id))
      .map((v) => ({ ...v, distKm: parseFloat(haversineKm(anchor.lat, anchor.lng, v.latitude, v.longitude).toFixed(2)) }))
      .sort((a, b) => a.distKm - b.distKm)
      .slice(0, 4);
  })();

  return (
    <APIProvider apiKey={API_KEY} libraries={["geometry", "marker", "places"]}>
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
          {travelMode === "TRANSIT" && <TransitLayer />}
          {travelMode
            ? (
              <DirectionsRenderer
                stops={trip}
                travelMode={travelMode}
                routeIndex={routeIndex}
                onSummary={setDirSummary}
                onRoutes={setRouteOptions}
                onTransitLegs={setTransitLegs}
              />
            )
            : tripData?.path && <TripPolyline path={tripData.path} />
          }
        </GMap>

        <button
          onClick={() => setView("dashboard")}
          style={{ position: "absolute", top: 60, right: 16, zIndex: 10, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: "system-ui", fontSize: 14, color: C.navy, boxShadow: "0 2px 8px rgba(27,42,74,0.12)" }}
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
          onClick={locateMe}
          title="Get current location"
          style={{ position: "absolute", bottom: 20, left: 10, zIndex: 10, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(27,42,74,0.18)", fontSize: 18 }}
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
          onManualLocation={setManualLocation}
          routeOptions={routeOptions}
          routeIndex={routeIndex}
          onSelectRoute={setRouteIndex}
          transitLegs={transitLegs}
          nearbyToAdd={nearbyToAdd}
          onAddStop={addStop}
          onAddCustomStop={addCustomStop}
          onSuggestBestOrder={() => planTrip(trip, true)}
        />

        {pendingSaveVendor && (
          <FolderPickerModal
            vendorName={pendingSaveVendor.name}
            folders={folders}
            onClose={() => setPendingSaveVendor(null)}
            onSave={confirmSaveBookmark}
            onCreateFolder={createFolderAndSave}
          />
        )}
        <Toast toast={toast} />
      </div>
    </APIProvider>
  );
}
