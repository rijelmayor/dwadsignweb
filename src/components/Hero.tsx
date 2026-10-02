import type { LandingSettings } from "@/lib/settings";
import { site } from "@/lib/site";

export default function Hero({ hero, links, branding }: { hero: LandingSettings["hero"]; links: LandingSettings["links"]; branding: LandingSettings["branding"] }) {
  return (
    <section className="relative pt-36 sm:pt-44 pb-20 sm:pb-28 px-5 sm:px-6 overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -right-32 h-[38rem] w-[38rem] rounded-full bg-teal/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-[34rem] w-[34rem] rounded-full bg-gold/15 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl grid lg:grid-cols-[1.2fr_0.8fr] gap-12 items-center">
        <div>
          <p className="rise text-teal text-sm font-semibold tracking-[0.3em] uppercase mb-6">{hero.eyebrow}</p>
          <h1 className="rise font-display text-5xl sm:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight" style={{ animationDelay: "0.1s" }}>
            {hero.headline} <span className="text-gradient">{hero.accent}</span> {hero.headlineEnd}
          </h1>
          <p className="rise mt-8 max-w-xl text-lg text-fog leading-relaxed" style={{ animationDelay: "0.2s" }}>{hero.sub}</p>
          <div className="rise mt-10 flex flex-wrap gap-4" style={{ animationDelay: "0.3s" }}>
            <a href={links.quoteUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-gold px-8 py-4 font-semibold text-ink hover:bg-gold-dim transition">{hero.ctaLabel}</a>
            <a href="#work" className="rounded-full border border-white/15 bg-white/5 px-8 py-4 font-semibold text-white backdrop-blur-md hover:border-teal hover:text-teal transition">See Our Work</a>
          </div>
          <p className="rise mt-10 font-display text-sm tracking-[0.35em] uppercase text-fog" style={{ animationDelay: "0.4s" }}>{site.tagline}</p>
        </div>
        <div className="flex justify-center">
          {branding.teamImage ? (
            <div className="water-card glass-panel relative w-full max-w-lg aspect-[4/3] overflow-hidden rounded-[2rem] p-2">
              <img src={branding.teamImage} alt={`${branding.companyName} team`} className="h-full w-full object-cover rounded-[1.5rem]" />
              <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/20 bg-ink/45 backdrop-blur-xl px-5 py-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-teal font-bold">The team behind the work</p>
                <p className="mt-1 font-display font-semibold">Design · Fabrication · Installation</p>
              </div>
            </div>
          ) : (
            <div className="water-card glass-panel w-full max-w-lg aspect-[4/3] rounded-[2rem] flex items-center justify-center p-10 text-center">
              <div><div className="text-gradient font-display text-5xl font-bold">{branding.companyName}</div><p className="text-fog mt-3">Add your team photo in Builder Settings.</p></div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
