import { useState, useEffect, useRef, useCallback } from "react";
import { C, FONT_DISPLAY, FONT_BODY } from "../../lib/theme";
import { HERO_SLIDES } from "../../lib/landingImages";

// 4-slide full-bleed hero carousel.
// - Giant "MELAKA" Playfair wordmark (always visible)
// - Per-slide: gold eyebrow caption + short description (top-left)
// - Persistent "600 Years of Culture, Heritage & Flavour" italic tagline
// - "SCROLL TO EXPLORE" label + "01/4" counter + dot pagination
// - Auto-advance every 5 s; dots are manual override
// - Crossfade transition; respects prefers-reduced-motion
export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const timerRef = useRef(null);
  const reducedMotion = useRef(
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ).current;

  const goTo = useCallback((idx) => {
    if (idx === current) return;
    if (!reducedMotion) {
      setFading(true);
      setTimeout(() => {
        setCurrent(idx);
        setFading(false);
      }, 400);
    } else {
      setCurrent(idx);
    }
  }, [current, reducedMotion]);

  // Auto-advance
  useEffect(() => {
    timerRef.current = setInterval(() => {
      goTo((current + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [current, goTo]);

  const slide = HERO_SLIDES[current];

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden" }}>
      {/* Background image */}
      <div style={{
        position: "absolute", inset: 0,
        opacity: fading ? 0 : 1,
        transition: reducedMotion ? "none" : "opacity 0.4s ease-in-out",
      }}>
        <img
          key={slide.id}
          src={slide.url}
          alt={slide.alt}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {/* Dark gradient overlays */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 40%, rgba(27,42,74,0.7) 100%)",
        }} />
      </div>

      {/* Giant MELAKA wordmark — centred */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        pointerEvents: "none",
      }}>
        <div style={{
          fontFamily: FONT_DISPLAY, fontWeight: 800,
          fontSize: "clamp(72px, 14vw, 160px)",
          color: "rgba(255,255,255,0.08)",
          letterSpacing: "0.12em",
          userSelect: "none",
          lineHeight: 1,
        }}>
          MELAKA
        </div>
      </div>

      {/* Slide caption — top-left */}
      <div style={{
        position: "absolute", top: "50%", left: 48,
        transform: "translateY(-50%)",
        maxWidth: 480,
        opacity: fading ? 0 : 1,
        transition: reducedMotion ? "none" : "opacity 0.4s ease-in-out",
      }}>
        {/* Gold eyebrow */}
        <div style={{
          fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12,
          color: C.gold, letterSpacing: 2.5, textTransform: "uppercase",
          marginBottom: 12,
        }}>
          {slide.eyebrow}
        </div>
        {/* Caption */}
        <div style={{
          fontFamily: FONT_DISPLAY, fontSize: "clamp(22px, 3.5vw, 36px)",
          fontWeight: 600, color: "#fff", lineHeight: 1.2,
        }}>
          {slide.caption}
        </div>
      </div>

      {/* Tagline + CTA — bottom-left */}
      <div style={{
        position: "absolute", bottom: 60, left: 48,
      }}>
        <div style={{
          fontFamily: FONT_DISPLAY, fontStyle: "italic", fontSize: "clamp(16px, 2vw, 22px)",
          color: "rgba(255,255,255,0.85)", marginBottom: 24, lineHeight: 1.4,
        }}>
          600 Years of Culture, Heritage & Flavour
        </div>
        <div style={{
          fontFamily: FONT_BODY, fontSize: 10.5, color: "rgba(255,255,255,0.55)",
          letterSpacing: 3, textTransform: "uppercase",
        }}>
          ↓ SCROLL TO EXPLORE
        </div>
      </div>

      {/* Slide counter + pagination dots — bottom-right */}
      <div style={{
        position: "absolute", bottom: 60, right: 48,
        display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 14,
      }}>
        {/* Counter */}
        <div style={{ fontFamily: FONT_BODY, color: "rgba(255,255,255,0.7)", fontSize: 12, letterSpacing: 1 }}>
          <span style={{ fontWeight: 700, color: "#fff", fontSize: 16 }}>
            {String(current + 1).padStart(2, "0")}
          </span>
          <span style={{ margin: "0 5px" }}>/</span>
          {String(HERO_SLIDES.length).padStart(2, "0")}
        </div>
        {/* Dots */}
        <div style={{ display: "flex", gap: 8 }}>
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => { clearInterval(timerRef.current); goTo(i); }}
              aria-label={`Slide ${i + 1}`}
              style={{
                width: i === current ? 28 : 8, height: 8, borderRadius: 4,
                background: i === current ? C.gold : "rgba(255,255,255,0.4)",
                border: "none", cursor: "pointer", padding: 0,
                transition: reducedMotion ? "none" : "width 0.3s ease, background 0.3s ease",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
