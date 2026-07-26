import { useState } from "react";

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// The password is visible only while the user holds the eye control. This
// keeps the behavior intentional and avoids leaving a password exposed after
// a click, while allowing the existing page styles to remain unchanged.
export default function PasswordField({ style, className, iconColor = "#888", ...inputProps }) {
  const [visible, setVisible] = useState(false);

  const show = () => setVisible(true);
  const hide = () => setVisible(false);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      show();
    }
  };

  const handleKeyUp = (event) => {
    if (event.key === "Enter" || event.key === " ") hide();
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        {...inputProps}
        type={visible ? "text" : "password"}
        className={className}
        style={{ ...style, width: "100%", boxSizing: "border-box", paddingRight: 40 }}
      />
      <button
        type="button"
        aria-label="Hold to view password"
        aria-pressed={visible}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture?.(event.pointerId);
          show();
        }}
        onPointerUp={hide}
        onPointerCancel={hide}
        onPointerLeave={hide}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        style={{
          position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer", padding: 2,
          color: iconColor, lineHeight: 1, display: "flex", alignItems: "center",
        }}
      >
        <EyeIcon />
      </button>
    </div>
  );
}
