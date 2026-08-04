import LandingNav from "../components/landing/LandingNav";
import HeroCarousel from "../components/landing/HeroCarousel";
import HeritageSection from "../components/landing/HeritageSection";
import ExperienceGrid from "../components/landing/ExperienceGrid";
import StatsBand from "../components/landing/StatsBand";
import QuoteSection from "../components/landing/QuoteSection";
import LocalGemsCta from "../components/landing/LocalGemsCta";
import LandingFooter from "../components/landing/LandingFooter";

// The editorial Melaka Tourism landing page at "/".
// Sections in order:
//   1. HeroCarousel       — full-bleed 4-slide landmark photo carousel
//   2. HeritageSection    — split editorial + lantern photo
//   3. ExperienceGrid     — navy bento photo grid
//   4. StatsBand          — navy 600+ / 14 / UNESCO
//   5. QuoteSection       — full-bleed pull-quote
//   6. LocalGemsCta       — "Find what the locals eat" → /map
//   7. LandingFooter      — navy footer
export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-chalk font-body text-ink">
      {/* Fixed nav — transparent over hero, solid on scroll */}
      <LandingNav />

      {/* Full-bleed hero — fills the dynamic viewport */}
      <HeroCarousel />

      {/* Editorial sections */}
      <HeritageSection />
      <ExperienceGrid />
      <StatsBand />
      <QuoteSection />
      <LocalGemsCta />
      <LandingFooter />
    </div>
  );
}
