"use client";

import { useEffect, useRef } from "react";
import type { LandingSettings } from "@/lib/settings";
import { site } from "@/lib/site";

export default function Hero({
  hero,
  links,
  branding,
}: {
  hero: LandingSettings["hero"];
  links: LandingSettings["links"];
  branding: LandingSettings["branding"];
}) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const orbs = el.querySelectorAll<HTMLElement>("[data-orb]");
    function onMove(e: MouseEvent) {
      const rect = el!.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      orbs.forEach((orb, i) => {
        const factor = (i + 1) * 10;
        orb.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
      });
    }
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative pt-[5.5rem] sm:pt-24 lg:pt-28 pb-10 sm:pb-14 px-5 sm:px-6 overflow-hidden"
    >
      {/* Parallax glow orbs */}
      <div
        data-orb
        className="pointer-events-none absolute -top-24 -right-24 h-[28rem] w-[28rem] rounded-full bg-teal/20 blur-[100px] transition-transform duration-300 ease-out"
      />
      <div
        data-orb
        className="pointer-events-none absolute -bottom-28 -left-24 h-[24rem] w-[24rem] rounded-full bg-gold/15 blur-[100px] transition-transform duration-300 ease-out"
      />
      <div
        data-orb
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[16rem] w-[16rem] rounded-full bg-teal/5 blur-[60px] transition-transform duration-500 ease-out"
      />

      <div className="relative mx-auto max-w-7xl grid lg:grid-cols-[1.2fr_0.8fr] gap-8 lg:gap-12 items-center">
        <div>
          <p className="rise text-teal text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-3 sm:mb-4">
            {hero.eyebrow}
          </p>
          <h1
            className="rise font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.95] tracking-tight"
            style={{ animationDelay: "0.1s" }}
          >
            {hero.headline}{" "}
            <span className="text-gradient relative inline-block">
              {hero.accent}
              <span className="absolute -inset-1 -z-10 blur-xl bg-gradient-to-r from-gold/30 to-teal/30 opacity-60" />
            </span>{" "}
            {hero.headlineEnd}
          </h1>
          <p
            className="rise mt-4 sm:mt-5 max-w-xl text-base sm:text-lg text-fog leading-relaxed"
            style={{ animationDelay: "0.2s" }}
          >
            {hero.sub}
          </p>
          <div className="rise mt-6 sm:mt-8 flex flex-wrap gap-3 sm:gap-4" style={{ animationDelay: "0.3s" }}>
            <a
              href={links.quoteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-full bg-gold px-7 sm:px-8 py-3 sm:py-3.5 font-semibold text-ink transition hover:bg-gold-dim hover:shadow-[0_0_40px_rgba(243,179,60,0.45)]"
            >
              <span className="relative z-10">{hero.ctaLabel}</span>
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-500" />
            </a>
            <a
              href="#work"
              className="rounded-full border border-white/15 bg-white/5 px-7 sm:px-8 py-3 sm:py-3.5 font-semibold text-white backdrop-blur-md hover:border-teal hover:text-teal hover:bg-teal/10 transition duration-300"
            >
              See Our Work
            </a>
          </div>
          <p
            className="rise mt-5 sm:mt-6 font-display text-xs sm:text-sm tracking-[0.35em] uppercase text-fog"
            style={{ animationDelay: "0.4s" }}
          >
            {site.tagline}
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          {branding.teamImage ? (
            <div className="water-card glass-panel relative w-full max-w-md lg:max-w-lg aspect-[4/3] overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] p-1.5 sm:p-2 floaty">
              <img
                src={branding.teamImage}
                alt={`${branding.companyName} team`}
                className="h-full w-full object-cover rounded-[1.25rem] sm:rounded-[1.5rem]"
              />
              <div className="absolute inset-x-4 sm:inset-x-6 bottom-4 sm:bottom-6 rounded-2xl border border-white/20 bg-ink/50 backdrop-blur-xl px-4 sm:px-5 py-3 sm:py-4 shadow-lg">
                <p className="text-[10px] uppercase tracking-[0.28em] text-teal font-bold">
                  The team behind the work
                </p>
                <p className="mt-0.5 font-display font-semibold text-sm sm:text-base">
                  Design · Fabrication · Installation
                </p>
              </div>
            </div>
          ) : (
            <div className="water-card glass-panel w-full max-w-md lg:max-w-lg aspect-[4/3] rounded-[2rem] flex items-center justify-center p-8 text-center">
              <div>
                <div className="text-gradient font-display text-4xl sm:text-5xl font-bold">
                  {branding.companyName}
                </div>
                <p className="text-fog mt-2 text-sm">Add your team photo in Builder Settings.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
