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
      className="fixed inset-0 z-[1300] flex cursor-zoom-out items-center justify-center bg-black/85 p-3 sm:p-8"
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-white/15"
      >
        <X size={20} color="#fff" />
      </button>
      <img
        src={src}
        alt="Review attachment enlarged"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[calc(100dvh-6rem)] max-w-full cursor-default rounded-lg object-contain"
      />
    </div>
  );
}
