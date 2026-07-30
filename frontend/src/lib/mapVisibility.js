// Which vendor pins the map draws, and the distance maths behind it.
// Pure — no React, no google.maps — so the rule can be tested directly.

const EARTH_RADIUS_KM = 6371;

// Great-circle distance. Accurate enough at city scale and dependency-free.
export function haversineKm(lat1, lng1, lat2, lng2) {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Trip stops ignore the radius on purpose: adding a stop further away than the
// current radius would otherwise make that stop's own pin disappear.
export function selectVisibleVendors({ vendors, anchor, radiusKm, showAll, stopIds, focusVendor }) {
  const visible = vendors.filter((v) => {
    if (v.latitude == null || v.longitude == null) return false;
    if (stopIds.has(v.id)) return true;
    if (!showAll || !anchor) return false;
    return haversineKm(anchor.lat, anchor.lng, v.latitude, v.longitude) <= radiusKm;
  });
  if (focusVendor && !visible.some((v) => v.id === focusVendor.id)) visible.push(focusVendor);
  return visible;
}
