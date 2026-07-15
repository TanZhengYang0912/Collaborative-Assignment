import { useEffect } from "react";
import { X } from "lucide-react";

// Click-to-enlarge viewer for review photo thumbnails — src=null renders nothing.
export default function ImageLightbox({ src, onClose }) {
  useEffect(() => {
    if (!src) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1300, padding: 24, cursor: "zoom-out",
      }}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: "50%",
          background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <X size={20} color="#fff" />
      </button>
      <img
        src={src}
        alt="Review attachment enlarged"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "92vw", maxHeight: "88vh", objectFit: "contain", borderRadius: 8, cursor: "default" }}
      />
    </div>
  );
}
