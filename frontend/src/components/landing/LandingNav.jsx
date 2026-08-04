import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import TrueBitesLogo from "../TrueBitesLogo";

// Transparent over the hero, transitions to solid chalk on scroll.
// Logo: TRUEBITES (Playfair) + MELAKA · MALAYSIA sub-label (Inter caps).
// Links: DISCOVER + EXPLORE scroll to page sections; PLAN VISIT → /map.
// Below md the links collapse into a hamburger panel.
const NAV_BASE =
  "fixed inset-x-0 top-0 z-[100] flex min-h-16 items-center justify-between px-5 py-3 transition-colors md:px-12";

const LINKS_BASE =
  "absolute inset-x-4 top-[calc(100%+8px)] flex-col gap-2 rounded-xl border border-sand bg-chalk p-3 shadow-xl " +
  "md:static md:inset-x-auto md:flex md:flex-row md:items-center md:gap-8 md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none";

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollTo(id) {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  // Open menu needs a readable surface even before the page has scrolled.
  const solid = scrolled || menuOpen;

  return (
    <nav
      className={solid
        ? `${NAV_BASE} border-b border-sand bg-chalk/95 backdrop-blur-md`
        : `${NAV_BASE} border-b border-transparent bg-transparent`}
    >
      {/* Wordmark */}
      <Link to="/" aria-label="Back to TrueBites home" className="flex items-center no-underline">
        <TrueBitesLogo size="header" tone={solid ? "default" : "light"} />
      </Link>

      <div className="flex items-center gap-2">
        {/* Links — panel below md, inline row from md */}
        <div id="landing-mobile-menu" className={menuOpen ? `flex ${LINKS_BASE}` : `hidden ${LINKS_BASE}`}>
          {[
            { label: "DISCOVER", action: () => scrollTo("heritage-section") },
            { label: "EXPLORE",  action: () => scrollTo("experience-section") },
          ].map(({ label, action }) => (
            <button
              key={label}
              onClick={action}
              className={solid
                ? "flex min-h-11 items-center rounded-lg px-2 text-left font-body text-[11.5px] font-semibold uppercase tracking-[1.8px] text-forest transition-opacity hover:opacity-70 motion-reduce:transition-none"
                : "flex min-h-11 items-center rounded-lg px-2 text-left font-body text-[11.5px] font-semibold uppercase tracking-[1.8px] text-forest transition-opacity hover:opacity-70 md:text-white/85 motion-reduce:transition-none"}
            >
              {label}
            </button>
          ))}

          <Link
            to="/map"
            onClick={() => setMenuOpen(false)}
            className={solid
              ? "flex min-h-11 items-center justify-center rounded-3xl border-[1.5px] border-forest bg-forest px-6 font-body text-xs font-semibold uppercase tracking-[1px] text-white no-underline transition-colors hover:bg-forest-light motion-reduce:transition-none"
              : "flex min-h-11 items-center justify-center rounded-3xl border-[1.5px] border-forest bg-forest px-6 font-body text-xs font-semibold uppercase tracking-[1px] text-white no-underline transition-colors hover:bg-forest-light md:border-white/70 motion-reduce:transition-none"}
          >
            Plan Visit
          </Link>
        </div>

        {/* Hamburger — phones only */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="landing-mobile-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className={solid
            ? "grid size-11 place-items-center rounded-lg text-forest md:hidden"
            : "grid size-11 place-items-center rounded-lg text-white md:hidden"}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </nav>
  );
}
