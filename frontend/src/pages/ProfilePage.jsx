import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import { supabase } from "../supabaseClient";
import { deleteAccount } from "../api";
import { C as THEME, FONT_BODY } from "../lib/theme";
import DobScrollPicker from "../components/DobScrollPicker";

function parseDob(iso) {
  if (!iso) return null;
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return null;
  return { day, month, year };
}
function formatDob({ day, month, year }) {
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
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

export default function ProfilePage() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const fileInputRef = useRef(null);
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

  if (!session && !loggingOut && !deleting) {
    navigate("/login", { replace: true });
    return null;
  }

  const meta = session?.user?.user_metadata || {};
  const userEmail = session?.user?.email || "";
  const avatarUrl = meta.avatar_url || "";
  const fullName = [meta.first_name, meta.last_name].filter(Boolean).join(" ");
  const savedDob = parseDob(meta.date_of_birth);
  const initials = fullName
    ? (meta.first_name?.[0] || "") + (meta.last_name?.[0] || "")
    : (userEmail ? userEmail.slice(0, 2).toUpperCase() : "?");

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    navigate("/map", { replace: true });
  };

  function startEditing() {
    setFirstName(meta.first_name || "");
    setLastName(meta.last_name || "");
    setDob(savedDob || { day: 1, month: 1, year: new Date().getFullYear() - 18 });
    setErrorMsg("");
    setEditing(true);
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Image must be under 5MB.");
      return;
    }

    setUploadingAvatar(true);
    setErrorMsg("");
    try {
      const ext = file.name.split(".").pop();
      const path = `${session.user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: pub.publicUrl },
      });
      if (updateError) throw updateError;

      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    } catch (err) {
      setErrorMsg(err.message || "Failed to upload photo.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteAccount(session.access_token);
      await supabase.auth.signOut();
      navigate("/map", { replace: true });
    } catch (err) {
      setDeleteError(err.message || "Failed to delete account.");
      setDeleting(false);
    }
  }

  async function handleSave() {
    const first = firstName.trim();
    const last = lastName.trim();

    if (!first || !last) {
      setErrorMsg("First and last name are required.");
      return;
    }
    if (first.length > 50) {
      setErrorMsg("First name must be 50 characters or fewer.");
      return;
    }
    if (last.length > 50) {
      setErrorMsg("Last name must be 50 characters or fewer.");
      return;
    }

    // Semantic: names must be letters only (allows spaces, hyphens, apostrophes for names like O'Brien, Al-Rashid)
    const namePattern = /^[a-zA-Z\s'\-.]+$/;
    if (!namePattern.test(first)) {
      setErrorMsg("First name must contain only letters.");
      return;
    }
    if (!namePattern.test(last)) {
      setErrorMsg("Last name must contain only letters.");
      return;
    }

    // Semantic: validate DOB is a real calendar date
    const dobDate = new Date(dob.year, dob.month - 1, dob.day);
    if (
      dobDate.getFullYear() !== dob.year ||
      dobDate.getMonth() + 1 !== dob.month ||
      dobDate.getDate() !== dob.day
    ) {
      setErrorMsg("Please enter a valid date of birth.");
      return;
    }

    const today = new Date();
    if (dobDate >= today) {
      setErrorMsg("Date of birth cannot be in the future.");
      return;
    }

    let age = today.getFullYear() - dob.year;
    if (
      today.getMonth() + 1 < dob.month ||
      (today.getMonth() + 1 === dob.month && today.getDate() < dob.day)
    ) age--;
    if (age < 13) {
      setErrorMsg("You must be at least 13 years old to use this app.");
      return;
    }
    if (age > 120) {
      setErrorMsg("Please enter a valid date of birth.");
      return;
    }

    const dobIso = `${dob.year}-${String(dob.month).padStart(2, "0")}-${String(dob.day).padStart(2, "0")}`;

    // Idempotency: skip API call if nothing actually changed
    if (
      first === (meta.first_name || "") &&
      last === (meta.last_name || "") &&
      dobIso === (meta.date_of_birth || "")
    ) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setErrorMsg("");
    const { error } = await supabase.auth.updateUser({
      data: { first_name: first, last_name: last, date_of_birth: dobIso },
    });
    setSaving(false);
    if (error) { setErrorMsg(error.message); return; }
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    setEditing(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: C.cream, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{
        background: C.card,
        borderRadius: 12,
        padding: "32px 24px",
        width: "100%",
        maxWidth: 340,
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

        <div style={{ position: "relative", width: 64, margin: "0 auto 24px" }}>
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
            overflow: "hidden",
          }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initials}
          </div>

          {editing && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                title="Change photo"
                style={{
                  position: "absolute", bottom: -2, right: -2,
                  width: 26, height: 26, borderRadius: "50%",
                  background: C.accent, color: "#fff", border: `2px solid ${C.card}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: uploadingAvatar ? "default" : "pointer",
                }}
              >
                <Camera size={13} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: "none" }}
              />
            </>
          )}
        </div>
        {editing && uploadingAvatar && (
          <div style={{ fontSize: 12, color: C.muted, marginTop: -16, marginBottom: 16 }}>Uploading…</div>
        )}

        {!editing ? (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, color: C.muted, marginBottom: 8 }}>Email</div>
              <div style={{ fontSize: 16, color: C.text, fontWeight: 500 }}>{userEmail}</div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, color: C.muted, marginBottom: 8 }}>Full Name</div>
              <div style={{ fontSize: 16, color: C.text, fontWeight: 500 }}>{fullName || "Not set"}</div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, color: C.muted, marginBottom: 8 }}>Date of Birth</div>
              <div style={{ fontSize: 16, color: C.text, fontWeight: 500 }}>{savedDob ? formatDob(savedDob) : "Not set"}</div>
            </div>

            <button
              onClick={startEditing}
              style={{
                width: "100%", padding: "12px 16px", fontSize: 14,
                background: "#fff", color: C.accent, border: `1.5px solid ${C.accent}`,
                borderRadius: 6, cursor: "pointer", fontWeight: 500,
                fontFamily: "system-ui", marginBottom: 10,
              }}
            >
              Edit Profile
            </button>

            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: 14,
                background: "#D64545",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 500,
                fontFamily: "system-ui",
                marginBottom: 24,
              }}
            >
              Log out
            </button>

            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, textAlign: "left" }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>
                Danger Zone
              </div>

              {!confirmingDelete ? (
                <button
                  onClick={() => { setConfirmingDelete(true); setDeleteError(""); }}
                  style={{
                    width: "100%", padding: "10px 16px", fontSize: 13.5,
                    background: "#fff", color: "#D64545", border: "1.5px solid #D64545",
                    borderRadius: 6, cursor: "pointer", fontWeight: 500, fontFamily: "system-ui",
                  }}
                >
                  Delete Account Permanently
                </button>
              ) : (
                <div style={{ background: "#FDEDEC", border: "1px solid #F3B8B3", borderRadius: 8, padding: 14 }}>
                  <p style={{ margin: "0 0 12px", fontSize: 13, color: "#8C2E24", lineHeight: 1.4 }}>
                    This permanently deletes your account and all its data from Supabase.
                    This cannot be undone.
                  </p>
                  {deleteError && <p style={{ color: "#c0392b", fontSize: 13, margin: "0 0 10px" }}>{deleteError}</p>}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setConfirmingDelete(false)}
                      disabled={deleting}
                      style={{
                        flex: 1, padding: "10px 16px", fontSize: 13.5,
                        background: "#fff", color: C.text, border: `1px solid ${C.border}`,
                        borderRadius: 6, cursor: "pointer", fontWeight: 500, fontFamily: "system-ui",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      style={{
                        flex: 1, padding: "10px 16px", fontSize: 13.5,
                        background: "#D64545", color: "#fff", border: "none",
                        borderRadius: 6, cursor: deleting ? "default" : "pointer", fontWeight: 600, fontFamily: "system-ui",
                      }}
                    >
                      {deleting ? "Deleting…" : "Yes, Delete Forever"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16, textAlign: "left" }}>
              <label style={{ fontSize: 13, color: C.muted }}>
                First name
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  maxLength={50}
                  style={{ display: "block", width: "100%", marginTop: 4, padding: 8, fontSize: 14, border: `1px solid ${C.border}`, borderRadius: 4, boxSizing: "border-box", fontFamily: FONT_BODY }}
                />
              </label>
              <label style={{ fontSize: 13, color: C.muted }}>
                Last name
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  maxLength={50}
                  style={{ display: "block", width: "100%", marginTop: 4, padding: 8, fontSize: 14, border: `1px solid ${C.border}`, borderRadius: 4, boxSizing: "border-box", fontFamily: FONT_BODY }}
                />
              </label>

              <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>Date of birth</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 4, fontSize: 10.5, color: C.muted, fontWeight: 600 }}>
                <span style={{ width: 68, textAlign: "center" }}>DAY</span>
                <span style={{ width: 68, textAlign: "center" }}>MONTH</span>
                <span style={{ width: 68, textAlign: "center" }}>YEAR</span>
              </div>
              <DobScrollPicker value={dob} onChange={setDob} />
            </div>

            {errorMsg && <p style={{ color: "#c0392b", fontSize: 13, marginBottom: 12 }}>{errorMsg}</p>}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setEditing(false)}
                disabled={saving}
                style={{
                  flex: 1, padding: "12px 16px", fontSize: 14,
                  background: "#fff", color: C.text, border: `1px solid ${C.border}`,
                  borderRadius: 6, cursor: "pointer", fontWeight: 500, fontFamily: "system-ui",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 1, padding: "12px 16px", fontSize: 14,
                  background: C.accent, color: "#fff", border: "none",
                  borderRadius: 6, cursor: saving ? "default" : "pointer", fontWeight: 500, fontFamily: "system-ui",
                }}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
