import Image from "next/image";
import type { LandingSettings } from "@/lib/settings";
import { site } from "@/lib/site";

export default function Hero({ hero, links }: { hero: LandingSettings["hero"]; links: LandingSettings["links"] }) {
  return (
    <section className="relative pt-44 pb-28 px-6 overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -right-32 h-[38rem] w-[38rem] rounded-full bg-teal/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-[34rem] w-[34rem] rounded-full bg-gold/15 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl grid lg:grid-cols-[1.5fr_1fr] gap-12 items-center">
        <div>
          <p className="rise text-teal text-sm font-semibold tracking-[0.3em] uppercase mb-6">{hero.eyebrow}</p>
          <h1 className="rise font-display text-5xl sm:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight" style={{ animationDelay: "0.1s" }}>
            {hero.headline} <span className="text-gradient">{hero.accent}</span> {hero.headlineEnd}
          </h1>
          <p className="rise mt-8 max-w-xl text-lg text-fog leading-relaxed" style={{ animationDelay: "0.2s" }}>{hero.sub}</p>
          <div className="rise mt-10 flex flex-wrap gap-4" style={{ animationDelay: "0.3s" }}>
            <a href={links.quoteUrl} target="_blank" rel="noopener noreferrer"
              className="rounded-full bg-gold px-8 py-4 font-semibold text-ink hover:bg-gold-dim transition">
              {hero.ctaLabel}
            </a>
            <a href="#work" className="rounded-full border border-line px-8 py-4 font-semibold text-white hover:border-teal hover:text-teal transition">
              See Our Work
            </a>
          </div>
          <p className="rise mt-10 font-display text-sm tracking-[0.35em] uppercase text-fog" style={{ animationDelay: "0.4s" }}>{site.tagline}</p>
        </div>
        <div className="hidden lg:flex justify-center">
          <Image src="/logo-mark.png" alt="Delight Works" width={520} height={251}
            className="floaty w-full max-w-md drop-shadow-[0_0_60px_rgba(30,202,201,0.25)]" priority />
        </div>
      </div>
    </section>
  );
}
