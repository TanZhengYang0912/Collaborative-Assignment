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
export default function PasswordField({ className = "", ...inputProps }) {
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
    <div className="relative">
      <input
        {...inputProps}
        type={visible ? "text" : "password"}
        className={`${className} pr-11`}
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
        className="absolute inset-y-0 right-0 flex min-h-11 w-11 items-center justify-center text-[#888]"
      >
        <EyeIcon />
      </button>
    </div>
  );
}
