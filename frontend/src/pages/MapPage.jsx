import { useState, useEffect, useCallback, useRef } from "react";
import { LoadScript, GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { getRestaurants, getRoute } from "../api";
import RestaurantMarkers from "../components/RestaurantMarkers";
import RoutePolyline from "../components/RoutePolyline";
import RoutePanel from "../components/RoutePanel";

const nightStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
];
const dayStyle = [];

const USER_ICON = {
  path: 0,
  scale: 10,
  fillColor: "#1d72e8",
  fillOpacity: 1,
  strokeColor: "#fff",
  strokeWeight: 2.5,
};

export default function MapPage() {
  const mapRef     = useRef(null);
  const pendingPan = useRef(null);
  const savedView  = useRef(null);

  const [isDark, setIsDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [userPos, setUserPos]           = useState(null);
  const [restaurants, setRestaurants]   = useState([]);
  const [selected, setSelected]         = useState(null);
  const [route, setRoute]               = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    mapRef.current?.setOptions({ styles: isDark ? nightStyle : dayStyle });
  }, [isDark]);

  const locateAndLoad = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        setUserPos({ lat, lng });
        if (mapRef.current) {
          mapRef.current.panTo({ lat, lng });
          mapRef.current.setZoom(14);
        } else {
          pendingPan.current = { lat, lng };
        }
        try {
          const data = await getRestaurants(lat, lng);
          setRestaurants(data.slice(0, 2));
        } catch (e) {
          alert("Failed to load restaurants: " + e.message);
        }
      },
      () => alert("Location access denied. Please allow location access.")
    );
  }, []);

  useEffect(() => { locateAndLoad(); }, [locateAndLoad]);

  function handleSelect(restaurant) {
    setSelected(restaurant);
    setRoute(null);
  }

  async function handleNavigate() {
    if (!selected || !userPos) return;
    if (mapRef.current) {
      savedView.current = {
        zoom:   mapRef.current.getZoom(),
        center: mapRef.current.getCenter(),
      };
    }
    setRouteLoading(true);
    try {
      const r = await getRoute(userPos, { lat: selected.lat, lng: selected.lng });
      setRoute(r);
      if (mapRef.current && r.path.length) {
        const bounds = new window.google.maps.LatLngBounds();
        r.path.forEach((p) => bounds.extend(p));
        mapRef.current.fitBounds(bounds, 60);
      }
    } catch (e) {
      alert("Routing failed: " + e.message);
    } finally {
      setRouteLoading(false);
    }
  }

  function handleClear() {
    setSelected(null);
    setRoute(null);
    if (mapRef.current && savedView.current) {
      mapRef.current.setZoom(savedView.current.zoom);
      mapRef.current.setCenter(savedView.current.center);
      savedView.current = null;
    }
  }

  const onMapLoad = useCallback((mapInstance) => {
    mapRef.current = mapInstance;
    mapInstance.setOptions({ styles: isDark ? nightStyle : dayStyle });
    if (pendingPan.current) {
      mapInstance.panTo(pendingPan.current);
      mapInstance.setZoom(14);
      pendingPan.current = null;
    }
    mapInstance.getStreetView().setOptions({
      addressControl:    true,
      panControl:        true,
      zoomControl:       true,
      linksControl:      true,
      enableCloseButton: true,
    });
  }, [isDark]);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <LoadScript googleMapsApiKey={import.meta.env.VITE_MAPS_BROWSER_KEY}>
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          defaultCenter={{ lat: 2.1896, lng: 102.2501 }}
          defaultZoom={12}
          onLoad={onMapLoad}
          options={{
            disableDefaultUI:  true,
            zoomControl:       true,
            streetViewControl: true,
            clickableIcons:    false,
          }}
        >
          {userPos && (
            <Marker
              position={userPos}
              title="You are here"
              icon={USER_ICON}
              zIndex={100}
            />
          )}

          <RestaurantMarkers
            restaurants={restaurants}
            selectedId={selected?.id}
            onSelect={handleSelect}
          />

          {selected && (
            <InfoWindow
              position={{ lat: selected.lat, lng: selected.lng }}
              onCloseClick={handleClear}
            >
              <div style={{ fontFamily: "system-ui", maxWidth: 210, fontSize: 13 }}>
                <strong style={{ fontSize: 14 }}>{selected.name}</strong>
                <div style={{ color: "#666", margin: "3px 0 8px" }}>{selected.address}</div>

                {!route && !routeLoading && (
                  <button
                    onClick={handleNavigate}
                    style={{
                      display: "block", width: "100%", padding: "8px 0",
                      background: "#1d72e8", color: "#fff", border: "none",
                      borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    🧭 Start Navigation
                  </button>
                )}

                {routeLoading && (
                  <div style={{ color: "#1d72e8", textAlign: "center" }}>
                    Getting directions…
                  </div>
                )}

                {route && !routeLoading && (
                  <div style={{ background: "#f0f7ff", borderRadius: 6, padding: "8px 10px" }}>
                    <div>🛣 <strong>{route.distance}</strong></div>
                    <div>⏱ <strong>{route.duration}</strong></div>
                  </div>
                )}
              </div>
            </InfoWindow>
          )}

          {route && <RoutePolyline path={route.path} />}
        </GoogleMap>
      </LoadScript>

      <RoutePanel
        selected={selected}
        route={route}
        userPos={userPos}
        loading={routeLoading}
        isDark={isDark}
        onToggleDark={() => setIsDark((d) => !d)}
        onLocate={locateAndLoad}
        onNavigate={handleNavigate}
        onClear={handleClear}
      />
    </div>
  );
}
