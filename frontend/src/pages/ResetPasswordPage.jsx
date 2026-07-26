import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { C as THEME, FONT_DISPLAY } from "../lib/theme";
import PasswordField from "../components/PasswordField";
import TrueBitesLogo from "../components/TrueBitesLogo";

const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const C = {
  cream: THEME.cream,
  card: THEME.card,
  accent: THEME.navy,
  text: THEME.text,
  muted: THEME.muted,
  border: THEME.border,
};

// Landed on via the "reset password" link emailed by resetPasswordForEmail().
// supabase-js reads the recovery token out of the URL and turns it into a
// real session automatically — we just wait for that before showing the form.
export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  const fromProfile = new URLSearchParams(window.location.search).get("redirect") === "profile";

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!PASSWORD_RE.test(password)) {
      setErrorMsg("Password must be at least 8 characters and include a letter and a number.");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setErrorMsg(error.message); return; }
    setDone(true);
    if (fromProfile) setTimeout(() => navigate("/profile", { replace: true }), 1500);
  }

  if (!ready) {
    return (
      <div className="auth-page" style={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center", background: C.cream, fontFamily: "Inter, system-ui, sans-serif", padding: "40px 16px" }}>
        <div style={{ color: C.muted, fontSize: 14 }}>Verifying your reset link…</div>
      </div>
    );
  }

  return (
    <div className="auth-page" style={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center", background: C.cream, fontFamily: "Inter, system-ui, sans-serif", padding: "40px 16px" }}>
      <div className="auth-stack reset-stack" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, width: "100%" }}>
        <Link className="auth-brand" to="/" aria-label="Back to TrueBites home">
          <TrueBitesLogo />
        </Link>
        <div className="auth-card reset-card" style={{ width: "min(100%, 460px)", background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, boxShadow: "0 18px 48px rgba(32, 42, 53, 0.09)" }}>
        <h2 className="auth-title" style={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: C.text, margin: "0 0 4px" }}>
          {done ? "Password reset" : "Set a new password"}
        </h2>

        {done ? (
          <>
            <p style={{ fontSize: 13.5, color: C.muted, margin: "8px 0 20px" }}>
              {fromProfile
                ? "Your password has been updated. Taking you back to your profile…"
                : "Your password has been updated. You can now sign in with it."}
            </p>
            <button className="auth-primary-button"
              onClick={() => navigate(fromProfile ? "/profile" : "/login", { replace: true })}
              style={{ width: "100%", padding: "10px 16px", fontSize: 14, border: "none", borderRadius: 4, background: C.accent, color: "#fff", cursor: "pointer", fontWeight: 500 }}
            >
              {fromProfile ? "Back to Profile" : "Go to Sign In"}
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
            <PasswordField
              className="auth-control"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: 8, fontSize: 14, border: `1px solid ${C.border}`, borderRadius: 4 }}
              required
              autoFocus
            />
            <PasswordField
              className="auth-control"
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              style={{ padding: 8, fontSize: 14, border: `1px solid ${C.border}`, borderRadius: 4 }}
              required
            />
            {errorMsg && <p style={{ color: "#c0392b", fontSize: 13, margin: 0 }}>{errorMsg}</p>}
            <button className="auth-primary-button"
              type="submit"
              disabled={loading}
              style={{ padding: 10, fontSize: 14, border: "none", borderRadius: 4, background: C.accent, color: "#fff", cursor: loading ? "default" : "pointer", fontWeight: 500 }}
            >
              {loading ? "Saving…" : "Set new password"}
            </button>
          </form>
        )}
        </div>
      </div>
    </div>
  );
}
