# TrueBites — Restaurant Navigation App

A self-pickup and dine-in restaurant discovery app with in-app map, route planning, and day/night mode.

## Tech Stack

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React + Vite | Map UI, restaurant markers, route display |
| Map Engine | Google Maps JS SDK (`@react-google-maps/api`) | In-app map, polylines, day/night style |
| Backend | Node.js + Express | Geocoding, proximity sort, Directions API |
| Database | Supabase (PostgreSQL + PostGIS) | Restaurant locations with spatial indexing |
| Proximity Sort | Haversine Formula | Sort restaurants by distance — no API cost |
| Geocoding | Google Geocoding API | Address → coordinates (once on insert) |
| Route Planning | Google Directions API | Real road distance, ETA, and route polyline |

## Features

- In-app navigation — no redirect to native Maps app
- Restaurant markers sorted by Haversine distance
- Real route polyline, distance, and ETA via Google Directions API
- Day/Night map mode — auto-detects OS preference, manual toggle available
- Night style is hardcoded in `App.jsx` — no configuration needed

---

## Team Workflow (for all teammates)

### 1. Clone the repo

```bash
git clone https://github.com/TanZhengYang0912/Collaborative-Assignment.git
cd Collaborative-Assignment
```

### 2. Create your own feature branch from main

```bash
git checkout main
git pull origin main
git checkout -b feature/your-module-name
```

Each person works on their own branch. Never commit directly to `main`.

### 3. Set up environment variables

```bash
# Copy the templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Then fill in the values — see the sections below.

### 4. Install dependencies and start the app

```bash
# Terminal 1 — Backend
cd backend
npm install
npm run dev
# Runs at http://localhost:4000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
# Runs at http://localhost:5173
```

### 5. When your feature is ready, push and open a PR

```bash
git add .
git commit -m "feat: describe your feature"
git push origin feature/your-module-name
```

Then open a Pull Request on GitHub to merge into `main`.

---

## Environment Variables

### `backend/.env`

```
GOOGLE_API_KEY=         # Server-side key — Geocoding API + Directions API
SUPABASE_URL=           # https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=   # Secret key — ask the project owner (Tan Zheng Yang)
PORT=4000
```

**How to get `GOOGLE_API_KEY`:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Geocoding API** and **Directions API**
3. Create an API key under **APIs & Services → Credentials**
4. (Recommended) Restrict key to server IPs only

**How to get `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`:**
- Ask the project owner (Tan Zheng Yang) — the service key is never committed to the repo

---

### `frontend/.env`

```
VITE_MAPS_BROWSER_KEY=  # Browser key — Maps JavaScript API only
VITE_API_BASE=http://localhost:4000
```

**How to get `VITE_MAPS_BROWSER_KEY`:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Maps JavaScript API**
3. Create an API key and restrict it to **HTTP referrers** (your localhost or domain)

> The frontend does **not** need Supabase keys. All database access goes through the backend.

---

## Adding Restaurants to Supabase

Only the project owner needs to do this. Restaurants are stored permanently — geocoding runs once on insert.

**Windows (PowerShell):**
```powershell
Invoke-WebRequest -Uri http://localhost:4000/api/restaurants `
  -Method POST `
  -ContentType 'application/json' `
  -Body '{"name": "Jonker 88", "address": "88 Jalan Hang Jebat, Melaka"}'
```

**Mac / Linux:**
```bash
curl -X POST http://localhost:4000/api/restaurants \
  -H "Content-Type: application/json" \
  -d '{"name": "Jonker 88", "address": "88 Jalan Hang Jebat, Melaka"}'
```

---

## Database Setup (first time only)

Run this once in **Supabase → SQL Editor**:

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

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/restaurants` | Add restaurant (geocodes address, stores in Supabase) |
| `GET` | `/api/restaurants/nearby?lat=&lng=` | Return nearest restaurants sorted by Haversine |
| `GET` | `/api/route?fromLat=&fromLng=&toLat=&toLng=` | Return road distance, ETA, and route polyline |

---

## Project Structure

```
Collaborative-Assignment/
├── backend/
│   ├── server.js       # Express routes — Geocoding, Proximity, Directions
│   ├── supabase.js     # Supabase client (reads SUPABASE_URL + SERVICE_KEY)
│   ├── haversine.js    # Haversine distance formula
│   ├── .env            # Real keys — never committed
│   └── .env.example    # Template for teammates
├── frontend/
│   ├── src/
│   │   ├── App.jsx                     # Main map — night style hardcoded here
│   │   ├── api.js                      # fetch wrappers for backend endpoints
│   │   └── components/
│   │       ├── RestaurantMarkers.jsx   # Custom bowl+chopsticks SVG markers
│   │       ├── RoutePolyline.jsx       # Two-layer polyline (visible night + day)
│   │       └── RoutePanel.jsx          # Sidebar — navigate, clear, dark toggle
│   ├── .env            # Real keys — never committed
│   └── .env.example    # Template for teammates
└── README.md
```
