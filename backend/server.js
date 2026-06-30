import express from "express";
import cors from "cors";
import "dotenv/config";
import mapRoutes    from "./routes/map.js";
import authRoutes   from "./routes/auth.js";
import vendorRoutes from "./routes/vendors.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api", mapRoutes);
app.use("/api", authRoutes);
app.use("/api", vendorRoutes);

app.listen(PORT, () => {
  console.log(`✅  TrueBites backend running on http://localhost:${PORT}`);
  if (!process.env.GOOGLE_API_KEY) {
    console.warn("⚠️  GOOGLE_API_KEY is missing — geocoding and directions will fail.");
  }
});
