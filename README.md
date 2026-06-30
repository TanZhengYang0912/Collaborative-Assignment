# TrueBites — Restaurant Navigation App

A self-pickup and dine-in restaurant discovery app with in-app map, route planning, and day/night mode.

## Tech Stack

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend UI | React + Vite | Responsive map interface and restaurant listings |
| Map Engine | Google Maps JavaScript SDK (`@react-google-maps/api`) | Renders restaurant markers, real-time route polylines, and day/night map style switching directly within the app |
| Backend | Node.js + Express.js | Route processing, geocoding, proximity sorting |
| Database | Supabase (PostgreSQL + PostGIS) | Stores restaurant locations with spatial indexing |
| Proximity Search | Haversine Formula | Fast proximity-based restaurant sorting without external API calls |
| Geocoding | Google Geocoding API | Converts restaurant addresses to coordinates (one-time on insert) |
| Route Planning | Google Directions API | Real road distance, ETA, and route polyline |

## Features

- In-app map with restaurant pins sorted by distance (Haversine)
- Real route polyline drawn on map (Google Directions API)
- Real distance and ETA from Google Directions API
- Day/Night map mode — auto-detects system preference, manual toggle available
- Night style is hardcoded in the app — teammates do not need to configure anything for it to work

## Project Structure

```
Mapping/
├── backend/          # Node.js + Express API server
│   ├── server.js     # Main server — Geocoding, Proximity, Directions routes
│   ├── supabase.js   # Supabase client
│   ├── haversine.js  # Haversine distance formula
│   ├── .env          # Your real keys (never committed)
│   └── .env.example  # Template for teammates
├── frontend/         # React + Vite app
│   ├── src/
│   │   ├── App.jsx   # Main map component with day/night styles
│   │   └── components/
│   ├── .env          # Your real keys (never committed)
│   └── .env.example  # Template for teammates
└── README.md
```

## Getting Started (for teammates)

### 1. Clone the repo

```bash
git clone <repo-url>
cd Mapping
```

### 2. Set up environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Fill in your own keys in both `.env` files (see below).

### 3. Get a Google API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project and enable billing
3. Go to **APIs & Services → Library** and enable:
   - Maps JavaScript API
   - Geocoding API
   - Directions API
4. Go to **APIs & Services → Credentials → Create API Key**
5. Copy the key into both `.env` files

### 4. Get Supabase keys

1. Go to [Supabase](https://supabase.com) and open the project
2. Go to **Settings → API**
3. Copy **Project URL** and **Publishable key** into `frontend/.env`
4. Ask the project owner for the **Secret key** for `backend/.env`

### 5. Set up the database (first time only)

Run this in **Supabase SQL Editor**:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE restaurants (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  address     TEXT NOT NULL,
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  location    GEOGRAPHY(Point, 4326),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE POLICY "Allow public read" ON restaurants FOR SELECT USING (true);
CREATE POLICY "Allow backend insert" ON restaurants FOR INSERT WITH CHECK (true);
```

### 6. Start the app

```bash
# Terminal 1 — Backend
cd backend
npm install
npm run dev
# Running at http://localhost:4000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
# Running at http://localhost:5175
```

### 7. Add a restaurant (test)

```bash
curl -X POST http://localhost:4000/api/restaurants \
  -H "Content-Type: application/json" \
  -d '{"name": "Jonker 88", "address": "88 Jalan Hang Jebat, Melaka"}'
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/restaurants` | Add a restaurant (triggers Geocoding API) |
| GET | `/api/restaurants/nearby?lat=&lng=` | Get restaurants sorted by distance |
| GET | `/api/route?fromLat=&fromLng=&toLat=&toLng=` | Get real route, distance, and ETA |

## Day/Night Map Mode

The night style is fully hardcoded in `frontend/src/App.jsx` — **teammates do not need to change any settings or configuration for it to work.** The app auto-detects the system dark/light preference on load, and a toggle button is available for manual switching.
