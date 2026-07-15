import { FONT_BODY } from "../../lib/theme";

export default function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div
      role="status"
      style={{
        position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
        background: toast.isError ? "#dc2626" : "#3E2C23", color: "#fff",
        padding: "11px 20px", borderRadius: 10, fontSize: 14, zIndex: 2000,
        boxShadow: "0 8px 24px rgba(0,0,0,.3)", maxWidth: "90vw", fontFamily: FONT_BODY,
      }}
    >
      {toast.msg}
    </div>
  );
}
