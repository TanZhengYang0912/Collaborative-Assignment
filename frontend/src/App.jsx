import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
<<<<<<< HEAD
import LandingPage    from "./pages/LandingPage";
=======
>>>>>>> 9c7e8808 (Latest-Combined)
import MapPage        from "./pages/MapPage";
import LoginPage      from "./pages/LoginPage";
import VendorsPage    from "./pages/VendorsPage";
import AIPage         from "./pages/AIPage";
import EngagementPage from "./pages/EngagementPage";
<<<<<<< HEAD
import AdminLayout                     from "./components/admin/AdminLayout";
import AdminDashboardPage              from "./pages/admin/AdminDashboardPage";
import AdminVendorManagementPage       from "./pages/admin/AdminVendorManagementPage";
import AdminAIProcessingConsolePage    from "./pages/admin/AdminAIProcessingConsolePage";
import AdminReviewModerationPage       from "./pages/admin/AdminReviewModerationPage";
import AdminSettingsPage               from "./pages/admin/AdminSettingsPage";
=======
>>>>>>> 9c7e8808 (Latest-Combined)

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
<<<<<<< HEAD
        {/* Editorial landing — the new front door */}
        <Route path="/"          element={<LandingPage />} />

        {/* Discovery app */}
        <Route path="/map"       element={<MapPage />} />
        <Route path="/login"     element={<LoginPage />} />
        <Route path="/vendors"   element={<VendorsPage />} />
        <Route path="/ai"        element={<AIPage />} />
        <Route path="/engagement" element={<EngagementPage />} />

        {/* Admin console */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="vendors2" element={<AdminVendorManagementPage />} />
          <Route path="ai" element={<AdminAIProcessingConsolePage />} />
          <Route path="reviews" element={<AdminReviewModerationPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        {/* Unknown paths → landing (not /map) */}
        <Route path="*"          element={<Navigate to="/" replace />} />
=======
        <Route path="/map"        element={<MapPage />} />
        <Route path="/login"      element={<LoginPage />} />
        <Route path="/vendors"    element={<VendorsPage />} />
        <Route path="/ai"         element={<AIPage />} />
        <Route path="/engagement" element={<EngagementPage />} />
        <Route path="*"           element={<Navigate to="/map" replace />} />
>>>>>>> 9c7e8808 (Latest-Combined)
      </Routes>
    </BrowserRouter>
  );
}
