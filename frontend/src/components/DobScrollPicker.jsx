import { useEffect, useRef } from "react";
import { C, FONT_BODY } from "../lib/theme";

const ITEM_H = 40;
const VISIBLE = 3;
const PAD = ITEM_H * Math.floor(VISIBLE / 2);

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1900 + 1 }, (_, i) => CURRENT_YEAR - i);

function pad2(n) { return String(n).padStart(2, "0"); }

// One scrollable wheel column (day / month / year). Native CSS scroll-snap
// gives the physical "wheel" feel; we just read scroll position to know
// which value is centred and report it back up.
function Column({ items, value, onChange, format = (v) => v }) {
  const ref = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const idx = Math.max(0, items.indexOf(value));
    if (ref.current) ref.current.scrollTop = idx * ITEM_H;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function commitFromScroll() {
    if (!ref.current) return;
    const idx = Math.round(ref.current.scrollTop / ITEM_H);
    const clamped = Math.min(items.length - 1, Math.max(0, idx));
    const next = items[clamped];
    if (next !== value) onChange(next);
  }

  function handleScroll() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(commitFromScroll, 120);
  }

  function handleMouseDown(e) {
    e.preventDefault();
    const el = ref.current;
    if (!el) return;
    const startY = e.clientY;
    const startTop = el.scrollTop;

    function onMove(ev) {
      el.scrollTop = startTop + (startY - ev.clientY);
    }

    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      // snap to nearest item then commit
      const idx = Math.round(el.scrollTop / ITEM_H);
      el.scrollTo({ top: Math.max(0, idx) * ITEM_H, behavior: "smooth" });
      commitFromScroll();
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      onMouseDown={handleMouseDown}
      style={{
        height: ITEM_H * VISIBLE,
        overflowY: "auto",
        scrollSnapType: "y mandatory",
        scrollbarWidth: "none",
        width: 68,
        cursor: "ns-resize",
        userSelect: "none",
      }}
    >
      <div style={{ height: PAD }} />
      {items.map((item) => {
        const active = item === value;
        return (
          <div
            key={item}
            style={{
              height: ITEM_H,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              scrollSnapAlign: "center",
              fontFamily: FONT_BODY,
              fontSize: active ? 17 : 14,
              fontWeight: active ? 700 : 400,
              color: active ? C.navy : C.muted,
              transition: "color 0.15s, font-size 0.15s",
            }}
          >
            {format(item)}
          </div>
        );
      })}
      <div style={{ height: PAD }} />
    </div>
  );
}

// Scrolling DD / MM / YYYY picker. value: { day, month, year } (numbers).
export default function DobScrollPicker({ value, onChange }) {
  const day = value?.day || 1;
  const month = value?.month || 1;
  const year = value?.year || CURRENT_YEAR - 18;

  return (
    <div style={{ position: "relative" }}>
      <div style={{
        position: "absolute", top: ITEM_H, left: 0, right: 0, height: ITEM_H,
        borderTop: `1.5px solid ${C.border}`, borderBottom: `1.5px solid ${C.border}`,
        pointerEvents: "none", background: "rgba(184,147,63,0.06)",
      }} />
      <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
        <Column items={DAYS} value={day} format={pad2} onChange={(d) => onChange({ day: d, month, year })} />
        <Column items={MONTHS} value={month} format={pad2} onChange={(m) => onChange({ day, month: m, year })} />
        <Column items={YEARS} value={year} onChange={(y) => onChange({ day, month, year: y })} />
      </div>
    </div>
  );
}
