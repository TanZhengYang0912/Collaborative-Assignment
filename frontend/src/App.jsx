import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import LandingPage    from "./pages/LandingPage";
import MapPage        from "./pages/MapPage";
import LoginPage      from "./pages/LoginPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import ProfilePage    from "./pages/ProfilePage";
import OnboardingPage from "./pages/OnboardingPage";
import VendorsPage    from "./pages/VendorsPage";
import AIPage         from "./pages/AIPage";
import EngagementPage from "./pages/EngagementPage";

const ONBOARDING_EXEMPT_PATHS = ["/onboarding", "/login", "/admin-login"];

// Wherever a session first appears — signing in, or landing back here after
// clicking the emailed confirmation link — force email/password accounts
// missing their name/DOB into onboarding before they reach the app.
function OnboardingGate({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    function check(session) {
      if (!session) return;
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
      <OnboardingGate>
        <Routes>
          {/* Editorial landing — the new front door */}
          <Route path="/"          element={<LandingPage />} />

          {/* Discovery app */}
          <Route path="/map"       element={<MapPage />} />
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/profile"   element={<ProfilePage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/vendors"   element={<VendorsPage />} />
          <Route path="/ai"        element={<AIPage />} />
          <Route path="/engagement" element={<EngagementPage />} />

          {/* Unknown paths → landing (not /map) */}
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </OnboardingGate>
    </BrowserRouter>
  );
}
