import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { listAdmins, addAdmin, removeAdmin } from "../api";
import "../ai-module.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SuperAdminPage() {
  const [session, setSession] = useState(undefined); // undefined = not yet loaded
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  const [removingId, setRemovingId] = useState(null);

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const notify = useCallback((msg, isError = false) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, isError });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return; // still loading
    if (!session || session.user?.app_metadata?.role !== "superadmin") {
      navigate("/admin-login", { replace: true });
    }
  }, [session, navigate]);

  const refresh = useCallback(async () => {
    if (!session) return;
    setLoadingAdmins(true);
    try {
      const { admins: list } = await listAdmins(session.access_token);
      setAdmins(list);
    } catch (err) {
      notify(err.message, true);
    } finally {
      setLoadingAdmins(false);
    }
  }, [session, notify]);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    navigate("/admin-login", { replace: true });
  }

  async function handleAddAdmin(e) {
    e.preventDefault();
    setAddError("");
    const email = newEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      setAddError("Enter a valid email address.");
      return;
    }
    setAdding(true);
    try {
      await addAdmin(session.access_token, email);
      setShowAddModal(false);
      setNewEmail("");
      notify(`Invited ${email}.`);
      refresh();
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(admin) {
    if (!window.confirm(`Remove admin ${admin.email}? This cannot be undone.`)) return;
    setRemovingId(admin.id);
    try {
      await removeAdmin(session.access_token, admin.id);
      notify(`Removed ${admin.email}.`);
      setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
    } catch (err) {
      notify(err.message, true);
    } finally {
      setRemovingId(null);
    }
  }

  if (!session) return null;

  return (
    <div className="app-bg">
      <button className="logout-btn" onClick={handleLogout} disabled={loggingOut}>
        {loggingOut ? "Logging out…" : "Logout"}
      </button>

      <div className="app-container">
        <header className="app-header">
          <div className="badge"><span>🛡️</span> Superadmin</div>
          <h1>Admin Management</h1>
          <p>Invite and remove admin accounts for the platform.</p>
        </header>

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <div className="card-title">Admins</div>
              <div className="card-subtitle" style={{ marginBottom: 0 }}>
                {admins.length} admin{admins.length === 1 ? "" : "s"}
              </div>
            </div>
            <button
              className="btn"
              onClick={() => { setShowAddModal(true); setAddError(""); setNewEmail(""); }}
              style={{ background: "var(--accent-secondary)", color: "#03242c" }}
            >
              + Add Admin
            </button>
          </div>

          {loadingAdmins ? (
            <p style={{ color: "var(--text-secondary)" }}>Loading…</p>
          ) : admins.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>No admins yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <th style={{ textAlign: "left", padding: "10px 8px", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600 }}>Email</th>
                    <th style={{ textAlign: "left", padding: "10px 8px", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600 }}>Status</th>
                    <th style={{ textAlign: "right", padding: "10px 8px", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((a) => (
                    <tr key={a.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 8px", color: "var(--text-primary)", fontSize: 14 }}>{a.email}</td>
                      <td style={{ padding: "12px 8px", fontSize: 13 }}>
                        {a.mustChangePassword ? (
                          <span style={{ color: "var(--warning)" }}>Pending first login</span>
                        ) : (
                          <span style={{ color: "var(--success)" }}>Active</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 8px", textAlign: "right" }}>
                        <button
                          onClick={() => handleRemove(a)}
                          disabled={removingId === a.id}
                          style={{
                            background: "none", border: "1px solid var(--error)", color: "var(--error)",
                            borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer",
                          }}
                        >
                          {removingId === a.id ? "Removing…" : "Remove"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div className="card" style={{ width: 380, maxWidth: "90vw" }}>
            <div className="card-title">Invite a new admin</div>
            <div className="card-subtitle">
              Their initial password will be set to their email address. They'll be required to set a new password on first sign-in.
            </div>
            <form onSubmit={handleAddAdmin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input
                className="url-input"
                type="email"
                placeholder="admin@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                autoFocus
                required
              />
              {addError && <p style={{ color: "var(--error)", fontSize: 13, margin: 0 }}>{addError}</p>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    background: "none", border: "1px solid var(--border)", color: "var(--text-secondary)",
                    borderRadius: 8, padding: "10px 18px", fontSize: 14, cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button className="btn" type="submit" disabled={adding} style={{ background: "var(--accent-gradient)", color: "#fff" }}>
                  {adding ? "Inviting…" : "Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: toast.isError ? "var(--error)" : "var(--success)", color: "#fff",
          padding: "11px 20px", borderRadius: 10, fontSize: 14, zIndex: 2000,
          boxShadow: "0 8px 24px rgba(0,0,0,.3)", maxWidth: "90vw",
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
