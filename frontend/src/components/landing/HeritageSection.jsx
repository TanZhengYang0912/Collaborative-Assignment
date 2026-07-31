import { HERITAGE_IMAGE } from "../../lib/landingImages";

// "HERITAGE & CULTURE" section — split layout: editorial text left, large
// lantern photo right. Includes UNESCO badge and two body paragraphs.
// Below md it becomes one column with the photo first.
export default function HeritageSection() {
  return (
    <section
      id="heritage-section"
      className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-10 bg-chalk px-5 py-14 md:grid-cols-2 md:gap-20 md:px-12 md:py-25"
    >
      {/* Editorial text column */}
      <div className="order-2 md:order-1">
        {/* Eyebrow */}
        <div className="mb-5 flex items-center gap-2.5 font-body text-[11px] font-semibold uppercase tracking-[3px] text-terracotta">
          <span className="block h-px w-7 bg-terracotta" />
          Heritage &amp; Culture
        </div>

        {/* Headline */}
        <h2 className="mb-7 font-display text-[clamp(32px,4vw,52px)] font-bold leading-tight text-forest">
          Where six centuries of history meet{" "}
          <span className="italic">on a single plate.</span>
        </h2>

        {/* Body */}
        <p className="mb-4.5 font-body text-base leading-[1.8] text-muted">
          Melaka's cuisine is a living archive — a flavour record written by Malay
          sultans, Dutch traders, Portuguese explorers, and the Peranakan Baba-Nyonya
          community who wove them all together. Every bowl of asam pedas, every kuih
          talam, every cup of thick kopi tells a chapter of that story.
        </p>
        <p className="mb-9 font-body text-base leading-[1.8] text-muted">
          TrueBites maps those stories — surfacing the hawker stalls, the
          century-old kopitiam, and the Nyonya kitchens that tourists walk past
          every day without knowing the legend hiding behind the door.
        </p>

        {/* UNESCO badge */}
        <div className="inline-flex items-center gap-3 rounded border-[1.5px] border-terracotta px-5 py-2.5">
          <span className="text-xl">🏛</span>
          <div>
            <div className="font-body text-[10.5px] font-bold uppercase tracking-[2px] text-terracotta">
              UNESCO World Heritage City
            </div>
            <div className="mt-0.5 font-body text-xs text-muted">
              Historic Cities of the Straits of Malacca — 2008
            </div>
          </div>
        </div>
      </div>

      {/* Photo column */}
      <div className="relative order-1 md:order-2">
        <div className="overflow-hidden rounded shadow-[16px_16px_0_0_rgba(163,93,71,0.15)]">
          <img
            src={HERITAGE_IMAGE.url}
            alt={HERITAGE_IMAGE.alt}
            className="block aspect-[4/3] w-full object-cover md:aspect-[4/5]"
          />
        </div>
        {/* Caption tab */}
        <div className="absolute -bottom-4 right-6 bg-forest px-4 py-2 font-body text-[11px] uppercase tracking-[1.5px] text-white">
          {HERITAGE_IMAGE.caption}
        </div>
      </div>
    </section>
  );
}
