// AUTH MODULE — Admin login (frontend only, no backend route yet).
// Mirrors LoginPage.jsx but drops Google OAuth and lands on /ai instead of /map.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import PasswordField from "../components/PasswordField";
import { AUTH_PAGE, AUTH_STACK, AUTH_CARD, AUTH_INPUT, AUTH_PRIMARY, AUTH_LINK, AUTH_ERROR } from "./LoginPage";

export default function AdminLoginPage() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [initializing, setInitializing] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setInitializing(false); });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setLoading(false);
        const errorMessage =
          error?.message ||
          error?.error_description ||
          error?.statusText ||
          error?.status ||
          (error && Object.keys(error).length > 0 ? JSON.stringify(error) : "Unknown error from Supabase");
        setErrorMsg(errorMessage);
        return;
      }

      // app_metadata can only be set via the service key (see admin setup docs),
      // so a user can never grant themselves admin by editing their own profile.
      const role = data.user?.app_metadata?.role;
      if (role !== "admin") {
        await supabase.auth.signOut();
        setLoading(false);
        setErrorMsg("This account is not authorized for admin access.");
        return;
      }

      setLoading(false);

      if (data.user?.user_metadata?.must_change_password) {
        navigate("/admin-set-password", { replace: true });
        return;
      }

      navigate("/admin", { replace: true });
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || "An unexpected error occurred");
    }
  }

  // Wait for session to load before rendering anything
  if (initializing) return null;

  // Already logged in as an admin — send them straight to the console.
  if (session) {
    const role = session.user?.app_metadata?.role;
    if (role === "admin") {
      if (session.user?.user_metadata?.must_change_password) {
        navigate("/admin-set-password", { replace: true });
      } else {
        navigate("/admin", { replace: true });
      }
      return null;
    }
  }

  return (
    <div className={AUTH_PAGE}>
      <div className={AUTH_STACK}>
        <h1 className="m-0 text-center font-display text-[clamp(24px,7vw,30px)] font-medium leading-tight text-ink">
          Admin login
        </h1>
        <div className={AUTH_CARD}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              className={AUTH_INPUT}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <PasswordField
              className={AUTH_INPUT}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <button className={AUTH_PRIMARY} type="submit" disabled={loading}>
              {loading ? "Please wait…" : "Sign In"}
            </button>
          </form>

          {errorMsg && <p className={AUTH_ERROR}>{errorMsg}</p>}

          <button className={AUTH_LINK} onClick={() => navigate("/map")}>
            Return to main page
          </button>
        </div>
      </div>
    </div>
  );
}
