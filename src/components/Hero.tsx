"use client";

import { useEffect, useRef } from "react";
import type { LandingSettings } from "@/lib/settings";

/** Splits text into words (never broken across lines) and letters (lit one by one). */
function LitText({ text, offset = 0 }: { text: string; offset?: number }) {
  let i = offset;
  return (
    <>
      {text.split(" ").map((word, w, all) => (
        <span key={w} className="inline-block whitespace-nowrap">
          {word.split("").map((ch, c) => (
            <span key={c} className="sign-char" style={{ ["--i" as string]: i++ }} aria-hidden>
              {ch}
            </span>
          ))}
          {w < all.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </>
  );
}

export default function Hero({
  hero,
  links,
  photo,
}: {
  hero: LandingSettings["hero"];
  links: LandingSettings["links"];
  /** Resolved background photo (explicit setting, else first project photo). */
  photo: string;
}) {
  const ref = useRef<HTMLElement>(null);

  // Cursor-reactive light — mouse only, so phones and tablets pay nothing for it.
  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    };
    el.addEventListener("pointermove", onMove);
    return () => {
      el.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const line1 = hero.headline;
  const line2 = `${hero.accent} ${hero.headlineEnd}`.trim();
  const full = `${line1} ${line2}`.trim();

  return (
    <section ref={ref} className="relative isolate flex min-h-[100svh] items-end overflow-hidden">
      {/* Background */}
      {photo ? (
        <div className="absolute inset-0 -z-20 overflow-hidden">
          <img src={photo} alt="" aria-hidden decoding="async" className="hero-photo h-full w-full object-cover" />
        </div>
      ) : (
        <div className="hero-fallback absolute inset-0 -z-20" />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/55 to-ink/50" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/80 via-ink/20 to-transparent" />
      <div className="hero-spot pointer-events-none absolute inset-0 -z-10 hidden md:block" />

      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 pt-28 pb-12 sm:pb-16 lg:pb-20">
        {hero.eyebrow && (
          <p className="mb-5 max-w-md text-sm text-fog sm:text-base">{hero.eyebrow}</p>
        )}

        <h1
          aria-label={full}
          className="font-display font-extrabold uppercase text-balance leading-[0.9] tracking-[-0.035em] text-[clamp(2.6rem,10.5vw,8.25rem)]"
        >
          <span className="block text-white" aria-hidden>
            {line1}
          </span>
          <span className="block" aria-hidden>
            <LitText text={line2} offset={line1.length} />
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">{hero.sub}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href={links.quoteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-full bg-gold px-9 text-base font-semibold text-ink transition hover:bg-gold-dim hover:shadow-[0_0_40px_rgba(243,179,60,0.45)]"
          >
            <span className="relative z-10">{hero.ctaLabel}</span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </a>
          <a
            href="#work"
            className="glass-panel inline-flex h-14 items-center justify-center rounded-full px-9 text-base font-semibold text-white transition hover:border-teal/60 hover:text-teal"
          >
            View our work
          </a>
        </div>
      </div>
    </section>
  );
}
