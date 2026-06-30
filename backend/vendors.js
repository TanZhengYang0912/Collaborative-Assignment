// Mock vendor data — stands in for what Toh Lian Thing's Vendor Management
// module will eventually store in MySQL. Real, roughly-correct Melaka coords.
export const vendors = [
  {
    id: 1,
    name: "Pak Putra Tandoori",
    cuisine: "Indian-Muslim",
    address: "Jalan Laksamana, Melaka",
    latitude: 2.1949,
    longitude: 102.2486,
    hiddenGemScore: 62,
    signatureDish: "Tandoori Chicken & Naan",
  },
  {
    id: 2,
    name: "Nyonya Suan",
    cuisine: "Baba-Nyonya",
    address: "Taman Kota Laksamana, Melaka",
    latitude: 2.1912,
    longitude: 102.2435,
    hiddenGemScore: 88,
    signatureDish: "Ayam Pongteh",
  },
  {
    id: 3,
    name: "Chetti Heritage Kitchen",
    cuisine: "Chetti Peranakan",
    address: "Gajah Berang, Melaka",
    latitude: 2.2034,
    longitude: 102.2399,
    hiddenGemScore: 95,
    signatureDish: "Pindang (tamarind fish)",
  },
  {
    id: 4,
    name: "Asam Pedas Selera Kampung",
    cuisine: "Malay",
    address: "Bukit Baru, Melaka",
    latitude: 2.2151,
    longitude: 102.2607,
    hiddenGemScore: 79,
    signatureDish: "Asam Pedas Ikan Pari",
  },
  {
    id: 5,
    name: "Hidden Hokkien Mee Stall",
    cuisine: "Chinese",
    address: "Jalan Bunga Raya, Melaka",
    latitude: 2.1985,
    longitude: 102.2492,
    hiddenGemScore: 71,
    signatureDish: "Hokkien Mee",
  },
];

// Fake "tourist saturation" points for the heatmap demo — clustered around
// Jonker Street, the over-touristed zone TrueBites wants to draw people AWAY from.
export const hotspots = [
  { lat: 2.1959, lng: 102.2476, weight: 5 },
  { lat: 2.1962, lng: 102.2469, weight: 4 },
  { lat: 2.1955, lng: 102.2481, weight: 5 },
  { lat: 2.1968, lng: 102.2472, weight: 3 },
  { lat: 2.1951, lng: 102.2465, weight: 4 },
  { lat: 2.1957, lng: 102.2488, weight: 2 },
];
