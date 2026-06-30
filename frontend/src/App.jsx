import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MapPage        from "./pages/MapPage";
import LoginPage      from "./pages/LoginPage";
import VendorsPage    from "./pages/VendorsPage";
import AIPage         from "./pages/AIPage";
import EngagementPage from "./pages/EngagementPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/map"        element={<MapPage />} />
        <Route path="/login"      element={<LoginPage />} />
        <Route path="/vendors"    element={<VendorsPage />} />
        <Route path="/ai"         element={<AIPage />} />
        <Route path="/engagement" element={<EngagementPage />} />
        <Route path="*"           element={<Navigate to="/map" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
