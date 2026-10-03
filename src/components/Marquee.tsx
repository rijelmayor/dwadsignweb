"use client";

/**
 * Quiet capability strip. Two identical tracks; CSS translates by exactly one track width.
 * Pauses on hover, stops for reduced-motion (see globals.css).
 */
export default function Marquee({ items }: { items: string[] }) {
  if (!items?.length) return null;
  const track = (hidden: boolean) => (
    <div className="flex shrink-0 items-center gap-8 pr-8" aria-hidden={hidden}>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-8 whitespace-nowrap font-display text-xs font-semibold tracking-[0.22em] text-fog sm:text-sm">
          {item}
          <span className="text-gold/70" aria-hidden>✦</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="marquee-root no-print overflow-hidden border-y border-white/10 bg-panel/60 py-4" role="presentation">
      <div className="marquee-viewport flex w-max will-change-transform">
        {track(false)}
        {track(true)}
      </div>
    </div>
  );
}
