"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ProjectItem } from "@/lib/settings";

const PAGE = 9;
const pad = (n: number) => String(n + 1).padStart(2, "0");

export default function Work({ projects }: { projects: ProjectItem[] }) {
  const [filter, setFilter] = useState("All");
  const [visible, setVisible] = useState(PAGE);
  const [selected, setSelected] = useState<ProjectItem | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const touchX = useRef<number | null>(null);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(projects.map((p) => p.tag.trim()).filter(Boolean)))],
    [projects]
  );
  const filtered = useMemo(
    () => (filter === "All" ? projects : projects.filter((p) => p.tag.trim() === filter)),
    [projects, filter]
  );
  const shown = filtered.slice(0, visible);

  function changeFilter(next: string) {
    setFilter(next);
    setVisible(PAGE);
  }
  function openProject(index: number) {
    setSelected(filtered[index]);
    setSelectedIndex(index);
    setImageLoaded(false);
  }
  const navigate = useCallback(
    (dir: -1 | 1) => {
      if (!filtered.length) return;
      const next = (selectedIndex + dir + filtered.length) % filtered.length;
      setSelectedIndex(next);
      setSelected(filtered[next]);
      setImageLoaded(false);
    },
    [filtered, selectedIndex]
  );

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
      if (e.key === "ArrowRight") navigate(1);
      if (e.key === "ArrowLeft") navigate(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [selected, navigate]);

  const meta = (p: ProjectItem) => [p.location, p.scope].filter(Boolean).join("  ·  ");

  return (
    <section id="work" className="relative py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-8 sm:mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-display text-[clamp(2.2rem,6vw,4.5rem)] font-extrabold uppercase leading-[0.95] tracking-[-0.03em] text-balance">
              Selected work
            </h2>
            <p className="mt-4 text-fog sm:text-lg">
              Signs, print and branding we designed, built and installed. Tap any project to see it full size.
            </p>
          </div>

          {categories.length > 1 && (
            <div
              className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 lg:justify-end"
              role="tablist"
              aria-label="Filter projects by category"
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={filter === cat}
                  onClick={() => changeFilter(cat)}
                  className={`h-11 shrink-0 rounded-full px-5 text-sm font-semibold transition duration-300 ${
                    filter === cat
                      ? "bg-gold text-ink shadow-[0_0_24px_rgba(243,179,60,0.3)]"
                      : "glass-panel text-fog hover:text-white hover:border-teal/60"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {shown.length ? (
          <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 md:mx-0 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-3">
            {shown.map((p, i) => (
              <button
                key={`${p.title}-${i}`}
                type="button"
                onClick={() => openProject(i)}
                className={`water-card group relative aspect-[4/5] w-[80vw] max-w-[24rem] shrink-0 snap-center overflow-hidden rounded-[1.75rem] border border-white/10 bg-panel text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal md:aspect-[4/3] md:w-auto md:max-w-none ${
                  i % 7 === 0 ? "lg:col-span-2 lg:aspect-[16/9]" : i % 7 === 4 ? "lg:row-span-2 lg:aspect-auto lg:min-h-[28rem]" : ""
                }`}
              >
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.title}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out md:group-hover:scale-[1.06]"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-panel-2 to-ink">
                    <span className="absolute right-5 top-3 font-display text-8xl font-extrabold text-white/5">{pad(i)}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/10 to-transparent" />

                <span className="glass-panel absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold tabular-nums text-white/90">
                  {pad(i)}
                </span>

                <div className="absolute inset-x-3 bottom-3 sm:inset-x-4 sm:bottom-4">
                  <div className="glass-panel rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4">
                    <p className="text-xs font-semibold text-gold">{p.tag || "Project"}</p>
                    <h3 className="mt-0.5 font-display text-lg font-bold leading-tight sm:text-xl">{p.title}</h3>
                    {meta(p) && <p className="hover-reveal mt-1.5 text-xs text-fog sm:text-sm">{meta(p)}</p>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-3xl p-12 text-center text-fog">No projects in this category yet.</div>
        )}

        {visible < filtered.length && (
          <div className="mt-10 text-center">
            <button
              onClick={() => setVisible((v) => v + PAGE)}
              className="h-12 rounded-full border border-teal/50 bg-teal/10 px-8 text-sm font-bold text-teal transition duration-300 hover:bg-teal hover:text-ink"
            >
              Show {Math.min(PAGE, filtered.length - visible)} more projects
            </button>
          </div>
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={selected.title}
          onClick={() => setSelected(null)}
        >
          <div className="absolute inset-0 bg-ink/90 backdrop-blur-2xl animate-in fade-in duration-300" />
          <div
            className="relative flex max-h-[100dvh] w-full max-w-6xl flex-col overflow-hidden rounded-t-[1.5rem] border border-white/15 bg-panel/95 shadow-[0_40px_100px_rgba(0,0,0,0.6)] animate-in zoom-in-95 fade-in duration-300 sm:max-h-[92dvh] sm:rounded-[1.75rem]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
              <span className="text-sm tabular-nums text-fog">
                {selectedIndex + 1} / {filtered.length}
              </span>
              <button
                autoFocus
                onClick={() => setSelected(null)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-ink/70 text-white transition hover:border-gold hover:bg-gold hover:text-ink"
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div
              className="relative flex min-h-[40dvh] flex-1 items-center justify-center bg-ink"
              onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
              onTouchEnd={(e) => {
                if (touchX.current === null) return;
                const dx = e.changedTouches[0].clientX - touchX.current;
                touchX.current = null;
                if (Math.abs(dx) > 50) navigate(dx < 0 ? 1 : -1);
              }}
            >
              {selected.image ? (
                <>
                  {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-10 w-10 animate-spin rounded-full border-2 border-teal/30 border-t-teal" />
                    </div>
                  )}
                  <img
                    src={selected.image}
                    alt={selected.title}
                    onLoad={() => setImageLoaded(true)}
                    className={`max-h-[58dvh] w-full object-contain transition-opacity duration-500 sm:max-h-[68dvh] ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                  />
                </>
              ) : (
                <p className="p-10 text-fog">Photo coming soon.</p>
              )}

              {filtered.length > 1 && (
                <>
                  <button
                    onClick={() => navigate(-1)}
                    className="glass-panel absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white transition hover:bg-teal hover:text-ink sm:left-4 sm:h-12 sm:w-12"
                    aria-label="Previous project"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 6l-6 6 6 6" /></svg>
                  </button>
                  <button
                    onClick={() => navigate(1)}
                    className="glass-panel absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white transition hover:bg-teal hover:text-ink sm:right-4 sm:h-12 sm:w-12"
                    aria-label="Next project"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 6l6 6-6 6" /></svg>
                  </button>
                </>
              )}
            </div>

            <div className="border-t border-white/10 px-5 py-4 sm:px-6 sm:py-5">
              <p className="text-xs font-semibold text-gold">{selected.tag || "Project"}</p>
              <h3 className="mt-0.5 font-display text-xl font-bold sm:text-2xl">{selected.title}</h3>
              {meta(selected) && <p className="mt-1 text-sm text-fog">{meta(selected)}</p>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
