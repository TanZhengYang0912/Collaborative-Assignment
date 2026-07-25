// Password `<input>` with a "hold to view" eye button — visible only while
// the button is pressed, hidden again the instant it's released (mouse up,
// mouse leaves the button, or touch ends). Shared by every password field in
// the app (login, register, forgot/reset password, admin login & set-password).

import { useState } from "react";

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function PasswordField({ style, className, iconColor = "#888", ...inputProps }) {
  const [visible, setVisible] = useState(false);
  const show = () => setVisible(true);
  const hide = () => setVisible(false);

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
        onMouseDown={show}
        onMouseUp={hide}
        onMouseLeave={hide}
        onTouchStart={show}
        onTouchEnd={hide}
        onTouchCancel={hide}
        tabIndex={-1}
        aria-label="Hold to view password"
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
