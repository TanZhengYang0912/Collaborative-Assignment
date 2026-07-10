import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { C, FONT_DISPLAY, FONT_BODY } from "../../lib/theme";

// Shown whenever a guest (no session) tries to bookmark, add a stop tied to
// their account, or open "My reviews" — actions that need an identity to
// mean anything.
export default function GuestPrompt({ open, onClose }) {
  const navigate = useNavigate();
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(27,42,74,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1100, padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 360, background: C.card, borderRadius: 16,
          padding: "28px 24px 24px", textAlign: "center", fontFamily: FONT_BODY,
          boxShadow: "0 20px 60px rgba(27,42,74,0.35)", position: "relative",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute", top: 12, right: 12, background: "none",
            border: "none", cursor: "pointer", color: C.muted, padding: 4,
          }}
        >
          <X size={18} />
        </button>

        <div style={{ fontSize: 32, marginBottom: 10 }}>🍜</div>
        <div style={{
          fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18,
          color: C.navy, marginBottom: 20, lineHeight: 1.35,
        }}>
          Sign in for a more personalized experience.
        </div>

        <button
          onClick={() => navigate("/login")}
          style={{
            width: "100%", padding: "12px 16px", borderRadius: 10,
            fontSize: 14.5, fontWeight: 600, fontFamily: FONT_BODY,
            background: C.navy, color: "#fff", border: "none", cursor: "pointer",
          }}
        >
          Log In
        </button>
      </div>
    </div>
  );
}
