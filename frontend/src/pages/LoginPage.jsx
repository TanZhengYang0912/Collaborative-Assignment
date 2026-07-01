// AUTH MODULE — Joshua
// Login / register UI backed directly by Supabase Auth (no custom Express routes).

import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const styles = {
  page: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    fontFamily: "sans-serif",
  },
  card: {
    width: 320,
    padding: 32,
    borderRadius: 8,
    boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  tabs: { display: "flex", gap: 8, marginBottom: 8 },
  tab: {
    flex: 1,
    padding: 8,
    textAlign: "center",
    cursor: "pointer",
    border: "1px solid #ccc",
    borderRadius: 4,
    background: "#f5f5f5",
  },
  tabActive: { background: "#333", color: "#fff", borderColor: "#333" },
  input: { padding: 8, fontSize: 14, border: "1px solid #ccc", borderRadius: 4 },
  button: {
    padding: 10,
    fontSize: 14,
    border: "none",
    borderRadius: 4,
    background: "#333",
    color: "#fff",
    cursor: "pointer",
  },
  googleButton: {
    padding: 10,
    fontSize: 14,
    border: "1px solid #ccc",
    borderRadius: 4,
    background: "#fff",
    cursor: "pointer",
  },
  divider: { textAlign: "center", color: "#999", fontSize: 12 },
  error: { color: "#c0392b", fontSize: 13 },
  info: { color: "#2c7a4b", fontSize: 13 },
};

export default function LoginPage() {
  const [session, setSession] = useState(null);
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

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

    const { error } =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    if (mode === "signup") {
      setInfoMsg("Check your email to confirm your account before signing in.");
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

  if (session) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p>Logged in as {session.user.email}</p>
          <button style={styles.button} onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
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
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Please wait…" : mode === "signup" ? "Create Account" : "Sign In"}
          </button>
        </form>

        {errorMsg && <p style={styles.error}>{errorMsg}</p>}
        {infoMsg && <p style={styles.info}>{infoMsg}</p>}

        <div style={styles.divider}>— or —</div>

        <button style={styles.googleButton} onClick={handleGoogleLogin}>
          Continue with Google
        </button>
      </div>
    </div>
  );
}
