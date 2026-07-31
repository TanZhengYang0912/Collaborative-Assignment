import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import PasswordField from "../components/PasswordField";

const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export default function SetAdminPasswordPage() {
  const [session, setSession] = useState(undefined); // undefined = not yet loaded
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  useEffect(() => {
    if (session === undefined) return; // still loading
    if (!session || !session.user?.user_metadata?.must_change_password) {
      navigate("/wsdasabi123&admin-login", { replace: true });
    }
  }, [session, navigate]);

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
    const { error } = await supabase.auth.updateUser({
      password,
      data: { must_change_password: false },
    });
    if (error) {
      setLoading(false);
      setErrorMsg(error.message);
      return;
    }

    setLoading(false);
    navigate("/admin", { replace: true });
  }

  if (!session) return null;

  return (
    <div className="app-bg">
      <div className="app-container" style={{ maxWidth: 440, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "40px 24px" }}>
        <header className="app-header">
          <div className="badge"><span>🔑</span> Admin Account</div>
          <h1 style={{ fontSize: 32 }}>Set your password</h1>
          <p>Your admin account has been created. Set a new password to continue.</p>
        </header>

        <div className="card" style={{ width: "100%" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <PasswordField
              className="url-input"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <PasswordField
              className="url-input"
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            <button className="btn" type="submit" disabled={loading} style={{ background: "var(--accent-gradient)", color: "#fff" }}>
              {loading ? "Saving…" : "Set password & continue"}
            </button>
          </form>
          {errorMsg && <p style={{ color: "var(--error)", fontSize: 13, marginTop: 12 }}>{errorMsg}</p>}
        </div>
      </div>
    </div>
  );
}
