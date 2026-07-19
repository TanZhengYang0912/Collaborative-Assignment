// AUTH MODULE — Admin landing page shown right after admin login.
// Lets a regular admin choose between the AI module and vendor management.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, Utensils } from "lucide-react";
import { supabase } from "../supabaseClient";
import { C as THEME, FONT_DISPLAY, FONT_BODY } from "../lib/theme";

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
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    fontFamily: FONT_BODY,
    background: C.cream,
    gap: 32,
    padding: 24,
  },
  grid: {
    display: "flex",
    gap: 24,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  button: {
    width: 260,
    height: 200,
    borderRadius: 4,
    border: `1px solid ${C.border}`,
    background: C.card,
    color: C.text,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    boxShadow: "0 10px 30px rgba(32,42,53,0.07)",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
  },
  icon: { fontSize: 48 },
  label: { fontSize: 20, fontWeight: 700 },
  sub: { fontSize: 13, color: C.muted },
  logoutBtn: {
    padding: "9px 18px",
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    background: C.card,
    color: C.text,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
};

export default function AdminHomePage() {
  const [session, setSession] = useState(null);
  const [checked, setChecked] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    navigate("/wsdasabi123&admin-login", { replace: true });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecked(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!checked) return;
    const role = session?.user?.app_metadata?.role;
    if (role !== "admin" && role !== "superadmin") {
      navigate("/wsdasabi123&admin-login", { replace: true });
    }
  }, [checked, session, navigate]);

  if (!checked || !session) return null;

  return (
    <div style={styles.page}>
      <h1 style={{
        fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 500,
        color: C.text, margin: 0, lineHeight: 1.2, textAlign: "center",
      }}>
        Welcome, admin
      </h1>

      <div style={styles.grid}>
        <button
          style={styles.button}
          onClick={() => navigate("/ai")}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <Bot size={32} color={C.accent} strokeWidth={1.5} />
          <span style={styles.label}>AI Module</span>
          <span style={styles.sub}>Review AI-generated content</span>
        </button>

        <button
          style={styles.button}
          onClick={() => navigate("/vendors")}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <Utensils size={32} color={C.accent} strokeWidth={1.5} />
          <span style={styles.label}>Vendor Management</span>
          <span style={styles.sub}>Create and publish eatery records</span>
        </button>
      </div>

      <button style={{ ...styles.logoutBtn, opacity: loggingOut ? 0.6 : 1 }} onClick={handleLogout} disabled={loggingOut}>
        {loggingOut ? "Logging out…" : "Logout"}
      </button>
    </div>
  );
}
