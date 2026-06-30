import express from "express";
import cors from "cors";
import "dotenv/config";
import pkg from '@googlemaps/polyline-codec';
const { decode } = pkg;
import { supabase } from "./supabase.js";
import { haversine } from "./haversine.js";

const app = express();
const PORT = process.env.PORT || 4000;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1 — GEOCODING (Address → Coordinates)
//
// Called ONCE when a restaurant is added. Coordinates are stored in Supabase
// and reused forever — this endpoint is never called on user search requests.
//
// POST /api/restaurants
// Body: { name: string, address: string }
// ─────────────────────────────────────────────────────────────────────────────
app.post("/api/restaurants", async (req, res) => {
  const { name, address } = req.body;
  if (!name || !address) {
    return res.status(400).json({ error: "name and address are required" });
  }

  // Step 1: Geocode the real address via Google Geocoding API
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

  // Step 2: Persist to Supabase.
  // lat + lng → used by Haversine in Node.js (Module 2).
  // location  → PostGIS GEOGRAPHY point for future spatial queries.
  // EWKT format: SRID=4326;POINT(lng lat)  — note: PostGIS is lng first.
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
// Fetches all restaurants from Supabase, applies Haversine in JavaScript,
// returns them sorted by distance ascending.
// ETA here is a rough estimate only — the real ETA comes from Module 3.
//
// GET /api/restaurants/nearby?lat=<user_lat>&lng=<user_lng>
// ─────────────────────────────────────────────────────────────────────────────
app.get("/api/restaurants/nearby", async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: "lat and lng query params are required" });
  }

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);

  // Pull all restaurants (lat + lng already stored from Geocoding on insert)
  const { data: restaurants, error } = await supabase
    .from("restaurants")
    .select("id, name, address, lat, lng");

  if (error) {
    return res.status(500).json({ error: "database query failed", details: error.message });
  }

  // Apply Haversine in Node.js, attach rough ETA
  const sorted = restaurants
    .filter((r) => r.lat != null && r.lng != null)
    .map((r) => {
      const distKm = haversine(userLat, userLng, r.lat, r.lng);
      return {
        ...r,
        distKm: parseFloat(distKm.toFixed(2)),
        // Rough estimates — shown BEFORE user selects a restaurant.
        // Final ETA comes from Google Directions API in Module 3.
        roughEtaDriving: Math.round((distKm / 40) * 60), // 40 km/h
        roughEtaWalking: Math.round((distKm / 5) * 60),  // 5 km/h
      };
    })
    .sort((a, b) => a.distKm - b.distKm);

  res.json(sorted);
});

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 3 — ROUTE PLANNING & FINAL ETA (Google Directions API)
//
// Called ONLY when a user selects a specific restaurant.
// Returns: real road distance, real ETA, decoded path for drawing on the map.
// The path is decoded server-side from each step's encoded polyline so the
// frontend doesn't need the geometry library.
//
// GET /api/route?fromLat=&fromLng=&toLat=&toLng=
// ─────────────────────────────────────────────────────────────────────────────
app.get("/api/route", async (req, res) => {
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

  // Decode each step's encoded polyline to build a detailed route path.
  // This is the path drawn on the map — derived from legs[0].steps as specified.
  const path = [];
  for (const step of leg.steps) {
    const points = decode(step.polyline.points);
    for (const [lat, lng] of points) {
      path.push({ lat, lng });
    }
  }

  res.json({
    // Real road distance and ETA from Directions API — shown to user as final values
    distance: leg.distance.text,
    duration: leg.duration.text,
    // Decoded path as {lat, lng} array — used to draw the Polyline on the map
    path,
  });
});

app.listen(PORT, () => {
  console.log(`✅  TrueBites backend running on http://localhost:${PORT}`);
  if (!GOOGLE_API_KEY) {
    console.warn("⚠️  GOOGLE_API_KEY is missing — geocoding and directions will fail.");
  }
});
