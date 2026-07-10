// AUTH MODULE — Admin login (frontend only, no backend route yet).
// Mirrors LoginPage.jsx but drops Google OAuth and lands on /ai instead of /map.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { C as THEME, FONT_DISPLAY } from "../lib/theme";

const C = {
  cream: THEME.cream,
  card: THEME.card,
  accent: THEME.navy,
  accentDark: THEME.navyLight,
  text: THEME.text,
  muted: THEME.muted,
  border: THEME.border,
};

const styles = {
  page: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    fontFamily: "system-ui",
    background: C.cream,
    position: "relative",
  },
  card: {
    width: 320,
    padding: 32,
    borderRadius: 8,
    boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    background: C.card,
  },
  tabs: { display: "flex", gap: 8, marginBottom: 8 },
  tab: {
    flex: 1,
    padding: 8,
    textAlign: "center",
    cursor: "pointer",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: C.border,
    borderRadius: 4,
    background: "#f5f5f5",
    color: C.text,
  },
  tabActive: { background: C.accent, color: "#fff", borderColor: C.accent, borderStyle: "solid", borderWidth: 1 },
  input: { padding: 8, fontSize: 14, border: `1px solid ${C.border}`, borderRadius: 4 },
  button: {
    padding: 10,
    fontSize: 14,
    border: "none",
    borderRadius: 4,
    background: C.accent,
    color: "#fff",
    cursor: "pointer",
    fontWeight: 500,
  },
  backLink: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    color: C.accent,
    fontFamily: "system-ui",
    padding: 0,
    marginTop: 8,
    textAlign: "center",
    textDecoration: "underline",
  },
  error: { color: "#c0392b", fontSize: 13 },
  info: { color: "#2c7a4b", fontSize: 13 },
};

export default function AdminLoginPage() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

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
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      setLoading(false);

      if (error) {
        const errorMessage =
          error?.message ||
          error?.error_description ||
          error?.statusText ||
          error?.status ||
          (error && Object.keys(error).length > 0 ? JSON.stringify(error) : "Unknown error from Supabase");
        setErrorMsg(errorMessage);
        return;
      }

      navigate("/ai", { replace: true });
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || "An unexpected error occurred");
    }
  }

  // Already logged in — go straight to the admin landing page.
  if (session) {
    navigate("/ai", { replace: true });
    return null;
  }

  return (
    <div style={styles.page}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <h1 style={{
          fontFamily: "'Courier New', Courier, monospace", fontSize: 30, fontWeight: 700,
          color: C.text, margin: 0, lineHeight: 1.2, textAlign: "center",
        }}>
          Admin login
        </h1>
        <div style={styles.card}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Please wait…" : "Sign In"}
          </button>
        </form>

        {errorMsg && <p style={styles.error}>{errorMsg}</p>}

        <button
          onClick={() => navigate("/map")}
          style={styles.backLink}
        >
          Return to main page
        </button>
        </div>
      </div>
    </div>
  );
}
