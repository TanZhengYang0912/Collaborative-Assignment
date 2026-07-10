import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import LandingPage    from "./pages/LandingPage";
import MapPage        from "./pages/MapPage";
import LoginPage      from "./pages/LoginPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminHomePage  from "./pages/AdminHomePage";
import SuperAdminPage from "./pages/SuperAdminPage";
import SetAdminPasswordPage from "./pages/SetAdminPasswordPage";
import ProfilePage    from "./pages/ProfilePage";
import OnboardingPage from "./pages/OnboardingPage";
import VendorsPage    from "./pages/VendorsPage";
import AIPage         from "./pages/AIPage";
import EngagementPage from "./pages/EngagementPage";
import AdminLayout                     from "./components/admin/AdminLayout";
import AdminDashboardPage              from "./pages/admin/AdminDashboardPage";
import AdminVendorManagementPage       from "./pages/admin/AdminVendorManagementPage";
import AdminAIProcessingConsolePage    from "./pages/admin/AdminAIProcessingConsolePage";
import AdminReviewModerationPage       from "./pages/admin/AdminReviewModerationPage";
import AdminSettingsPage               from "./pages/admin/AdminSettingsPage";

const ONBOARDING_EXEMPT_PATHS = ["/onboarding", "/login", "/admin-login", "/admin-home", "/superadmin", "/admin-set-password"];

// Admin/superadmin accounts never have a customer-facing home — they only
// ever belong on the admin auth pages or the AI/vendor management tools.
const ADMIN_ALLOWED_PATHS = ["/admin-login", "/admin-home", "/superadmin", "/admin-set-password", "/ai", "/vendors"];

// Paths under /admin (the admin console) are always allowed for admin/superadmin accounts.
function isAdminAllowedPath(pathname) {
  return ADMIN_ALLOWED_PATHS.includes(pathname) || pathname.startsWith("/admin/");
}

// Wherever a session first appears — signing in, or landing back here after
// clicking the emailed confirmation link — route the account to where it
// belongs: admins/superadmins never reach onboarding or the main map, and
// email/password customers missing their name/DOB are forced into onboarding.
function AuthGate({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    function check(session) {
      if (!session) return;
      const role = session.user.app_metadata?.role;

      if (role === "admin" || role === "superadmin") {
        if (!isAdminAllowedPath(location.pathname)) {
          navigate(role === "superadmin" ? "/superadmin" : "/admin-home", { replace: true });
        }
        return;
      }

      const provider = session.user.app_metadata?.provider;
      const meta = session.user.user_metadata || {};
      const needsOnboarding = provider === "email" && !meta.first_name;
      if (needsOnboarding && !ONBOARDING_EXEMPT_PATHS.includes(location.pathname)) {
        navigate("/onboarding", { replace: true });
      }
    }
    supabase.auth.getSession().then(({ data }) => check(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => check(s));
    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthGate>
        <Routes>
          {/* Editorial landing — the new front door */}
          <Route path="/"          element={<LandingPage />} />

          {/* Discovery app */}
          <Route path="/map"       element={<MapPage />} />
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/admin-home" element={<AdminHomePage />} />
          <Route path="/superadmin" element={<SuperAdminPage />} />
          <Route path="/admin-set-password" element={<SetAdminPasswordPage />} />
          <Route path="/profile"   element={<ProfilePage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
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
        </Routes>
      </AuthGate>
    </BrowserRouter>
  );
}
