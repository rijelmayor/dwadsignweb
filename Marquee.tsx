"use client";

/**
 * Seamless infinite ticker.
 * Two identical tracks side-by-side; CSS translates by exactly one track width.
 * Pauses on hover. Respects prefers-reduced-motion via globals.css.
 */
export default function Marquee({ items }: { items: string[] }) {
  if (!items?.length) return null;

  const track = (
    <div className="marquee-track flex shrink-0 items-center gap-10 pr-10" aria-hidden={false}>
      {items.map((item, i) => (
        <span
          key={i}
          className="font-display font-bold text-ink text-sm tracking-[0.25em] flex items-center gap-10 whitespace-nowrap"
        >
          {item}
          <span className="opacity-40 select-none" aria-hidden>
            ✦
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div
      className="marquee-root border-y border-line bg-gradient-to-r from-gold via-gold to-teal py-3.5 overflow-hidden no-print"
      role="presentation"
    >
      <div className="marquee-viewport flex w-max will-change-transform">
        {track}
        {/* Duplicate for seamless loop — must stay identical to the first track */}
        <div className="marquee-track flex shrink-0 items-center gap-10 pr-10" aria-hidden>
          {items.map((item, i) => (
            <span
              key={`dup-${i}`}
              className="font-display font-bold text-ink text-sm tracking-[0.25em] flex items-center gap-10 whitespace-nowrap"
            >
              {item}
              <span className="opacity-40 select-none" aria-hidden>
                ✦
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
