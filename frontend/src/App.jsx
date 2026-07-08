import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage    from "./pages/LandingPage";
import MapPage        from "./pages/MapPage";
import LoginPage      from "./pages/LoginPage";
import ProfilePage    from "./pages/ProfilePage";
import VendorsPage    from "./pages/VendorsPage";
import AIPage         from "./pages/AIPage";
import EngagementPage from "./pages/EngagementPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Editorial landing — the new front door */}
        <Route path="/"          element={<LandingPage />} />

        {/* Discovery app */}
        <Route path="/map"       element={<MapPage />} />
        <Route path="/login"     element={<LoginPage />} />
        <Route path="/profile"   element={<ProfilePage />} />
        <Route path="/vendors"   element={<VendorsPage />} />
        <Route path="/ai"        element={<AIPage />} />
        <Route path="/engagement" element={<EngagementPage />} />

        {/* Unknown paths → landing (not /map) */}
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
