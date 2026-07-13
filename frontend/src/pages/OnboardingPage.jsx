import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { C, FONT_DISPLAY, FONT_BODY } from "../lib/theme";
import DobScrollPicker from "../components/DobScrollPicker";

const STEPS = ["Full Name", "Date of Birth"];
const CURRENT_YEAR = new Date().getFullYear();

// Forced 2-step onboarding right after email/password signup — collects the
// account's first/last name and DOB before the user can reach the app.
export default function OnboardingPage() {
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState({ day: 1, month: 1, year: CURRENT_YEAR - 18 });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate("/login", { replace: true });
        return;
      }
      // Idempotency: already completed onboarding — skip ahead
      const meta = data.session.user.user_metadata || {};
      if (meta.first_name && meta.date_of_birth) {
        navigate("/map", { replace: true });
        return;
      }
      setChecking(false);
    });
  }, [navigate]);

  if (checking) return null;

  const namePattern = /^[a-zA-Z\s'\-.]+$/;
  const canContinueStep0 = firstName.trim().length > 0 && lastName.trim().length > 0;

  function handleContinue() {
    const first = firstName.trim();
    const last = lastName.trim();
    if (first.length > 50) { setErrorMsg("First name must be 50 characters or fewer."); return; }
    if (last.length > 50) { setErrorMsg("Last name must be 50 characters or fewer."); return; }
    if (!namePattern.test(first)) { setErrorMsg("First name must contain only letters."); return; }
    if (!namePattern.test(last)) { setErrorMsg("Last name must contain only letters."); return; }
    setErrorMsg("");
    setStep(1);
  }

  async function finish() {
    // Semantic: validate DOB is a real calendar date
    const dobDate = new Date(dob.year, dob.month - 1, dob.day);
    if (
      dobDate.getFullYear() !== dob.year ||
      dobDate.getMonth() + 1 !== dob.month ||
      dobDate.getDate() !== dob.day
    ) { setErrorMsg("Please enter a valid date of birth."); return; }

    const today = new Date();
    if (dobDate >= today) { setErrorMsg("Date of birth cannot be in the future."); return; }

    let age = today.getFullYear() - dob.year;
    if (today.getMonth() + 1 < dob.month || (today.getMonth() + 1 === dob.month && today.getDate() < dob.day)) age--;
    if (age < 13) { setErrorMsg("You must be at least 13 years old to use this app."); return; }
    if (age > 120) { setErrorMsg("Please enter a valid date of birth."); return; }

    setSaving(true);
    setErrorMsg("");
    const dobIso = `${dob.year}-${String(dob.month).padStart(2, "0")}-${String(dob.day).padStart(2, "0")}`;
    const { error } = await supabase.auth.updateUser({
      data: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        date_of_birth: dobIso,
      },
    });
    setSaving(false);
    if (error) { setErrorMsg(error.message); return; }
    navigate("/map", { replace: true });
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: C.cream, fontFamily: FONT_BODY, padding: 24,
    }}>
      <div style={{
        width: "100%", maxWidth: 380, background: C.card, borderRadius: 16,
        padding: "32px 28px", boxShadow: "0 20px 60px rgba(27,42,74,0.2)",
      }}>
        {/* Step progression line */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
          {STEPS.map((label, i) => (
            <div key={label} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "0 0 auto" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: i <= step ? C.navy : C.cream,
                  border: `1.5px solid ${i <= step ? C.navy : C.border}`,
                  color: i <= step ? "#fff" : C.muted,
                  fontSize: 12.5, fontWeight: 700, flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 10.5, color: i === step ? C.navy : C.muted, fontWeight: i === step ? 600 : 400, whiteSpace: "nowrap" }}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, background: i < step ? C.navy : C.border, margin: "0 8px 18px" }} />
              )}
            </div>
          ))}
        </div>

        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: C.navy, margin: "0 0 4px" }}>
          {step === 0 ? "What's your name?" : "When were you born?"}
        </h2>
        <p style={{ fontSize: 13, color: C.muted, margin: "0 0 20px" }}>
          {step === 0
            ? "Let's personalize your TrueBites experience."
            : "Used to tailor recommendations — kept private."}
        </p>

        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              autoFocus
              placeholder="First name"
              value={firstName}
              onChange={(e) => { setFirstName(e.target.value); setErrorMsg(""); }}
              maxLength={50}
              style={{ padding: 10, fontSize: 14, border: `1px solid ${C.border}`, borderRadius: 6, fontFamily: FONT_BODY }}
            />
            <input
              placeholder="Last name"
              value={lastName}
              onChange={(e) => { setLastName(e.target.value); setErrorMsg(""); }}
              maxLength={50}
              style={{ padding: 10, fontSize: 14, border: `1px solid ${C.border}`, borderRadius: 6, fontFamily: FONT_BODY }}
            />
            {errorMsg && <p style={{ color: "#c0392b", fontSize: 13, margin: 0 }}>{errorMsg}</p>}
            <button
              onClick={handleContinue}
              disabled={!canContinueStep0}
              style={{
                marginTop: 8, padding: "12px 16px", borderRadius: 8, border: "none",
                background: canContinueStep0 ? C.navy : C.border, color: "#fff",
                fontSize: 14, fontWeight: 600, cursor: canContinueStep0 ? "pointer" : "default",
                fontFamily: FONT_BODY,
              }}
            >
              Continue
            </button>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 4, fontSize: 11, color: C.muted, fontWeight: 600 }}>
              <span style={{ width: 68, textAlign: "center" }}>DAY</span>
              <span style={{ width: 68, textAlign: "center" }}>MONTH</span>
              <span style={{ width: 68, textAlign: "center" }}>YEAR</span>
            </div>
            <DobScrollPicker value={dob} onChange={setDob} />

            {errorMsg && <p style={{ color: "#c0392b", fontSize: 13, margin: 0 }}>{errorMsg}</p>}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setStep(0)}
                style={{
                  padding: "12px 16px", borderRadius: 8, border: `1px solid ${C.border}`,
                  background: "#fff", color: C.navy, fontSize: 14, fontWeight: 600,
                  cursor: "pointer", fontFamily: FONT_BODY,
                }}
              >
                Back
              </button>
              <button
                onClick={finish}
                disabled={saving}
                style={{
                  flex: 1, padding: "12px 16px", borderRadius: 8, border: "none",
                  background: C.navy, color: "#fff", fontSize: 14, fontWeight: 600,
                  cursor: saving ? "default" : "pointer", fontFamily: FONT_BODY,
                }}
              >
                {saving ? "Saving…" : "Finish"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
