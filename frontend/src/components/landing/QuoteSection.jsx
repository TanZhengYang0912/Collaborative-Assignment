import { QUOTE_IMAGE } from "../../lib/landingImages";

// Full-bleed shophouse photo backdrop with "PERANAKAN HERITAGE" eyebrow
// and a big italic serif pull-quote. Sized in svh so the section keeps its
// proportions when mobile browser chrome shows and hides.
export default function QuoteSection() {
  return (
    <section className="relative min-h-[60svh] overflow-hidden md:min-h-[70svh]">
      {/* Background image */}
      <img
        src={QUOTE_IMAGE.url}
        alt={QUOTE_IMAGE.alt}
        className="absolute inset-0 block size-full object-cover"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(64,84,74,0.82)_0%,rgba(64,84,74,0.45)_100%)]" />

      {/* Content */}
      <div className="relative flex min-h-[60svh] flex-col items-center justify-center px-5 py-16 text-center md:min-h-[70svh] md:px-12">
        {/* Eyebrow */}
        <div className="mb-7 flex items-center gap-3.5 font-body text-[11px] font-semibold uppercase tracking-[3.5px] text-terracotta">
          <span className="block h-px w-6 bg-terracotta md:w-8" />
          Peranakan Heritage
          <span className="block h-px w-6 bg-terracotta md:w-8" />
        </div>

        {/* Pull-quote */}
        <blockquote className="m-0 max-w-[860px] font-display text-[clamp(24px,4vw,52px)] font-semibold italic leading-[1.3] text-white [text-shadow:0_2px_20px_rgba(0,0,0,0.3)]">
          "Nowhere else in the world will you taste this."
        </blockquote>

        {/* Attribution */}
        <div className="mt-6 font-body text-[13px] tracking-[0.5px] text-white/60">
          — The spirit of Melaka's table
        </div>
      </div>
    </section>
  );
}
