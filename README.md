# TrueBites — Restaurant Navigation

A self-pickup and dine-in restaurant discovery app with in-app map, route planning, and day/night mode.

## Contributors

| Module | Member | Responsibility |
|---|---|---|
| Map/Navigation — Backend | Tan Zheng Yang | Express API, Google Geocoding API, Haversine proximity sort, Google Directions API, Supabase integration |
| Map/Navigation — Frontend | Ng Chi Hao | Google Maps UI, restaurant markers, route polyline, RoutePanel, day/night mode |
| Auth | Joshua | Login, register, session management |
| Vendors | Toh Lian Thing | Vendor listings and management |
| AI Content Processing | Tan Chun Jie | Video URL submission, speech-to-text, summarization, info extraction |
| Engagement & Bookmarking | Khor Yik Qi | Wishlist folders, star ratings, reviews, photo upload, helpful likes |

## Member contribution log
JOSHUA - I have added a frontend for login page. I just need Tan Zheng Yang's Supabase access to do backend.

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
- Night style is hardcoded in `MapPage.jsx` — no configuration needed

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

| Variable | Description | How to get |
|---|---|---|
| `GOOGLE_API_KEY` | Server-side key for Geocoding API + Directions API | Ask Tan Zheng Yang |
| `SUPABASE_URL` | Supabase project URL | Ask Tan Zheng Yang |
| `SUPABASE_SERVICE_KEY` | Supabase secret key (never committed) | Ask Tan Zheng Yang |
| `PORT` | Server port (default 4000) | Leave as `4000` |

---

### `frontend/.env`

| Variable | Description | How to get |
|---|---|---|
| `VITE_MAPS_BROWSER_KEY` | Google Maps browser key | Ask Tan Zheng Yang |
| `VITE_API_BASE` | Backend URL | Leave as `http://localhost:4000` |

> The frontend does **not** need Supabase keys — all database access goes through the backend.

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
│   ├── server.js               # Entry point — mounts all route modules
│   ├── routes/
│   │   ├── map.js              # Map module        (Tan Zheng Yang) — restaurants, route
│   │   ├── auth.js             # Auth module        (Joshua)         — login, register
│   │   ├── vendors.js          # Vendors module     (Toh Lian Thing) — vendor routes
│   │   ├── ai.js               # AI module          (Tan Chun Jie)   — video URL, transcribe, summarize, extract
│   │   └── engagement.js       # Engagement module  (Khor Yik Qi)    — wishlist, reviews, likes
│   ├── supabase.js             # Supabase client
│   ├── haversine.js            # Haversine distance formula
│   ├── .env                    # Real keys — never committed
│   └── .env.example            # Template for teammates
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Router only — wires all pages
│   │   ├── api.js              # fetch wrappers for backend endpoints
│   │   ├── pages/
│   │   │   ├── MapPage.jsx         # Map module        (Tan Zheng Yang) — full map UI
│   │   │   ├── LoginPage.jsx       # Auth module        (Joshua)         — login/register UI
│   │   │   ├── VendorsPage.jsx     # Vendors module     (Toh Lian Thing) — vendor UI
│   │   │   ├── AIPage.jsx          # AI module          (Tan Chun Jie)   — video submit + results
│   │   │   └── EngagementPage.jsx  # Engagement module  (Khor Yik Qi)    — wishlist, reviews, likes
│   │   └── components/
│   │       ├── RestaurantMarkers.jsx   # Custom SVG markers
│   │       ├── RoutePolyline.jsx       # Two-layer polyline (day + night)
│   │       └── RoutePanel.jsx          # Sidebar — navigate, clear, dark toggle
│   ├── .env                    # Real keys — never committed
│   └── .env.example            # Template for teammates
└── README.md
```
