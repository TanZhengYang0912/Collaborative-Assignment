import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const C = {
  cream: "#FBF4EA",
  card: "#FFFFFF",
  accent: "#D85A30",
  accentDark: "#993C1D",
  text: "#3E2C23",
  muted: "#9A8478",
  border: "#EADBCB",
};

export default function ProfilePage() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.cream, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!session) {
    navigate("/login", { replace: true });
    return null;
  }

  const userEmail = session?.user?.email || "";
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "?";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/map", { replace: true });
  };

  return (
    <div style={{ minHeight: "100vh", background: C.cream, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{
        background: C.card,
        borderRadius: 12,
        padding: "32px 24px",
        width: "100%",
        maxWidth: 320,
        boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
        textAlign: "center",
        fontFamily: "system-ui",
        position: "relative",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <button
            onClick={() => navigate("/map")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 20,
              color: C.accentDark,
              padding: 0,
            }}
          >
            ←
          </button>
          <h2 style={{ margin: 0, color: C.text, fontSize: 18, fontWeight: 600 }}>My Profile</h2>
          <div style={{ width: 20 }} />
        </div>

        <div style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: C.accent,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          fontWeight: 600,
          margin: "0 auto 24px",
        }}>
          {initials}
        </div>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 14, color: C.muted, marginBottom: 8 }}>Email</div>
          <div style={{ fontSize: 16, color: C.text, fontWeight: 500 }}>{userEmail}</div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "12px 16px",
            fontSize: 14,
            background: C.accent,
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 500,
            fontFamily: "system-ui",
          }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}
