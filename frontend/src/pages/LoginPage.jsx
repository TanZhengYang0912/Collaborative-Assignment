// AUTH MODULE — Joshua
// Login / register UI backed directly by Supabase Auth (no custom Express routes).

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { C as THEME, FONT_DISPLAY } from "../lib/theme";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}

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
  googleButton: {
    padding: 10,
    fontSize: 14,
    border: `1px solid ${C.border}`,
    borderRadius: 4,
    background: C.card,
    cursor: "pointer",
    color: C.text,
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
  divider: { textAlign: "center", color: C.muted, fontSize: 12 },
  error: { color: "#c0392b", fontSize: 13 },
  info: { color: "#2c7a4b", fontSize: 13 },
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [mode, setMode] = useState("signin"); // "signin" | "signup" — always opens on Sign In
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [justSignedUp, setJustSignedUp] = useState(false);

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
    setInfoMsg("");
    setLoading(true);

    try {
      const response =
        mode === "signup"
          ? await supabase.auth.signUp({ email, password })
          : await supabase.auth.signInWithPassword({ email, password });

      const { error, data } = response;

      console.log("Full auth response:", response);
      console.log("Error:", error);
      console.log("Data:", data);

      setLoading(false);

      if (error) {
        console.error("Full error object:", error);
        console.error("Error keys:", Object.keys(error));
        console.error("Error toString:", error.toString());
        console.error("Error name:", error.name);
        console.error("Error status:", error.status);
        console.error("Error code:", error.code);
        console.error("Error details:", error.__isAuthError);

        const errorMessage =
          error?.message ||
          error?.error_description ||
          error?.statusText ||
          error?.status ||
          (error && Object.keys(error).length > 0 ? JSON.stringify(error) : "Unknown error from Supabase");
        setErrorMsg(errorMessage);
        return;
      }

      if (mode === "signup") {
        if (data?.user?.identities?.length === 0) {
          setErrorMsg("This email is already registered. Please sign in instead.");
        } else if (data?.session) {
          // Confirmed immediately (email confirmation off) — collect name/DOB.
          setJustSignedUp(true);
          navigate("/onboarding", { replace: true });
        } else {
          setInfoMsg("Account created! Check your email to confirm before signing in.");
          setEmail("");
          setPassword("");
        }
      } else {
        navigate("/map", { replace: true });
      }
    } catch (err) {
      setLoading(false);
      console.error("Unexpected error:", err);
      setErrorMsg(err.message || "An unexpected error occurred");
    }
  }

  async function handleGoogleLogin() {
    setErrorMsg("");
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) setErrorMsg(error.message);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  // Already logged in — go back to the app (unless we're mid-redirect to onboarding)
  if (session && !justSignedUp) {
    navigate("/map", { replace: true });
    return null;
  }

  return (
    <div style={styles.page}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <h1 style={{
          fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 700,
          color: C.text, margin: 0, lineHeight: 1.2, textAlign: "center",
        }}>
          One step closer for a
          <br />
          <span style={{ color: THEME.gold, fontStyle: "italic" }}>better experience</span>...
        </h1>
        <div style={styles.card}>
        <div style={styles.tabs}>
          <div
            style={{ ...styles.tab, ...(mode === "signin" ? styles.tabActive : {}) }}
            onClick={() => {
              setMode("signin");
              setErrorMsg("");
              setInfoMsg("");
            }}
          >
            Sign In
          </div>
          <div
            style={{ ...styles.tab, ...(mode === "signup" ? styles.tabActive : {}) }}
            onClick={() => {
              setMode("signup");
              setErrorMsg("");
              setInfoMsg("");
            }}
          >
            Create Account
          </div>
        </div>

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
          <button
            style={mode === "signup" ? { ...styles.button, background: THEME.gold } : styles.button}
            type="submit"
            disabled={loading}
          >
            {loading ? "Please wait…" : mode === "signup" ? "Create Account" : "Sign In"}
          </button>
        </form>

        {errorMsg && <p style={styles.error}>{errorMsg}</p>}
        {infoMsg && <p style={styles.info}>{infoMsg}</p>}

        <div style={styles.divider}>— or —</div>

        <button style={{ ...styles.googleButton, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }} onClick={handleGoogleLogin}>
          <GoogleIcon />
          Continue with Google
        </button>

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
