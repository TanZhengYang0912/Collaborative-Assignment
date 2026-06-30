import { Router } from "express";
import pkg from "@googlemaps/polyline-codec";
const { decode } = pkg;
import { supabase } from "../supabase.js";
import { haversine } from "../haversine.js";

const router = Router();
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1 — GEOCODING (Address → Coordinates)
//
// Called ONCE when a restaurant is added. Coordinates are stored in Supabase
// and reused forever — never called on user search requests.
//
// POST /api/restaurants
// Body: { name: string, address: string }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/restaurants", async (req, res) => {
  const { name, address } = req.body;
  if (!name || !address) {
    return res.status(400).json({ error: "name and address are required" });
  }

  const geoUrl =
    `https://maps.googleapis.com/maps/api/geocode/json` +
    `?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`;

  let geoData;
  try {
    geoData = await (await fetch(geoUrl)).json();
  } catch (err) {
    return res.status(502).json({ error: "geocoding request failed", details: err.message });
  }

  if (geoData.status !== "OK") {
    return res.status(502).json({ error: "geocoding failed", status: geoData.status });
  }

  const { lat, lng } = geoData.results[0].geometry.location;

  const { data, error } = await supabase
    .from("restaurants")
    .insert({
      name,
      address,
      lat,
      lng,
      location: `SRID=4326;POINT(${lng} ${lat})`,
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: "database insert failed", details: error.message });
  }

  res.status(201).json(data);
});

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 2 — PROXIMITY SEARCH (Haversine in Node.js)
//
// Fetches all restaurants from Supabase, sorts by Haversine distance.
// Rough ETA shown before user selects a restaurant — real ETA from Module 3.
//
// GET /api/restaurants/nearby?lat=<user_lat>&lng=<user_lng>
// ─────────────────────────────────────────────────────────────────────────────
router.get("/restaurants/nearby", async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: "lat and lng query params are required" });
  }

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);

  const { data: restaurants, error } = await supabase
    .from("restaurants")
    .select("id, name, address, lat, lng");

  if (error) {
    return res.status(500).json({ error: "database query failed", details: error.message });
  }

  const sorted = restaurants
    .filter((r) => r.lat != null && r.lng != null)
    .map((r) => {
      const distKm = haversine(userLat, userLng, r.lat, r.lng);
      return {
        ...r,
        distKm: parseFloat(distKm.toFixed(2)),
        roughEtaDriving: Math.round((distKm / 40) * 60),
        roughEtaWalking: Math.round((distKm / 5) * 60),
      };
    })
    .sort((a, b) => a.distKm - b.distKm);

  res.json(sorted);
});

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 3 — ROUTE PLANNING & FINAL ETA (Google Directions API)
//
// Called ONLY when user taps "Start Navigation" on a specific restaurant.
// Returns real road distance, real ETA, and decoded path for the map polyline.
//
// GET /api/route?fromLat=&fromLng=&toLat=&toLng=
// ─────────────────────────────────────────────────────────────────────────────
router.get("/route", async (req, res) => {
  const { fromLat, fromLng, toLat, toLng } = req.query;
  if (!fromLat || !fromLng || !toLat || !toLng) {
    return res.status(400).json({ error: "fromLat, fromLng, toLat, toLng are required" });
  }

  const directionsUrl =
    `https://maps.googleapis.com/maps/api/directions/json` +
    `?origin=${fromLat},${fromLng}` +
    `&destination=${toLat},${toLng}` +
    `&mode=driving` +
    `&key=${GOOGLE_API_KEY}`;

  let data;
  try {
    data = await (await fetch(directionsUrl)).json();
  } catch (err) {
    return res.status(502).json({ error: "directions request failed", details: err.message });
  }

  if (data.status !== "OK" || !data.routes.length) {
    return res.status(502).json({ error: "directions failed", status: data.status });
  }

  const leg = data.routes[0].legs[0];

  const path = [];
  for (const step of leg.steps) {
    const points = decode(step.polyline.points);
    for (const [lat, lng] of points) {
      path.push({ lat, lng });
    }
  }

  res.json({
    distance: leg.distance.text,
    duration: leg.duration.text,
    path,
  });
});

export default router;
