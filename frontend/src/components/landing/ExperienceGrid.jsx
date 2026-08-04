import { BENTO_IMAGES } from "../../lib/landingImages";

// "EXPERIENCE MELAKA / A city like no other." bento photo grid.
// From md: 2-column grid with the first image spanning both rows.
// Below md: a single column of fixed-height cells, with the two smallest
// sharing a row so the stack does not run absurdly long on a phone.
export default function ExperienceGrid() {
  return (
    <section id="experience-section" className="bg-forest px-5 py-14 md:px-12 md:py-25">
      <div className="mx-auto max-w-[1280px]">
        {/* Section header */}
        <div className="mb-8 md:mb-12">
          <div className="mb-4 flex items-center gap-2.5 font-body text-[11px] font-semibold uppercase tracking-[3px] text-terracotta">
            <span className="block h-px w-7 bg-terracotta" />
            Experience Melaka
          </div>
          <h2 className="font-display text-[clamp(30px,4vw,52px)] font-bold leading-[1.15] text-white">
            A city like no other.
          </h2>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.4fr_1fr] md:grid-rows-[300px_300px]">
          {/* Large hero cell — spans both rows from md */}
          <BentoCell img={BENTO_IMAGES[0]} large className="h-[220px] md:h-auto md:row-span-2" />

          {/* Two smaller cells stacked */}
          <div className="flex min-h-0 flex-col gap-3 md:row-span-2">
            <BentoCell img={BENTO_IMAGES[1]} className="h-[180px] md:h-auto md:flex-1" />
            <div className="grid grid-cols-2 gap-3 md:flex-1">
              <BentoCell img={BENTO_IMAGES[2]} className="h-[140px] md:h-auto" />
              <BentoCell img={BENTO_IMAGES[3]} className="h-[140px] md:h-auto" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BentoCell({ img, large, className = "" }) {
  return (
    <div className={`relative min-h-0 overflow-hidden rounded ${className}`}>
      <img src={img.url} alt={img.alt} className="block size-full object-cover" />
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(64,84,74,0.75)_0%,transparent_50%)]" />
      {/* Label */}
      <div
        className={large
          ? "absolute bottom-4 left-4 font-display text-[22px] font-bold tracking-[0.5px] text-white"
          : "absolute bottom-4 left-4 font-display text-[15px] font-bold tracking-[0.5px] text-white"}
      >
        {img.label}
      </div>
    </div>
  );
}
