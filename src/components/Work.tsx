"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ProjectItem } from "@/lib/settings";

export default function Work({ projects }: { projects: ProjectItem[] }) {
  const [filter, setFilter] = useState("All");
  const [visible, setVisible] = useState(9);
  const [selected, setSelected] = useState<ProjectItem | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

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
    setVisible(9);
  }

  function openProject(p: ProjectItem, indexInFiltered: number) {
    setSelected(p);
    setSelectedIndex(indexInFiltered);
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
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelected(null);
      if (e.key === "ArrowRight") navigate(1);
      if (e.key === "ArrowLeft") navigate(-1);
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [selected, navigate]);

  return (
    <section id="work" className="relative px-5 sm:px-6 py-24 border-t border-white/10">
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-teal/40 to-transparent" />
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <p className="text-teal text-sm font-semibold tracking-[0.3em] uppercase mb-4">Selected work</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">Built. Lit. Installed.</h2>
            <p className="mt-4 max-w-2xl text-fog">
              A living portfolio of signs, print, branding and display work by DW AdSign.
            </p>
          </div>
          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => changeFilter(cat)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition duration-300 ${
                    filter === cat
                      ? "bg-gold text-ink shadow-[0_0_24px_rgba(243,179,60,0.35)] scale-105"
                      : "glass-panel text-fog hover:text-white hover:border-teal/60 hover:scale-105"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {shown.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((p, i) => {
              const filteredIndex = filtered.indexOf(p);
              return (
                <button
                  key={`${p.title}-${i}`}
                  type="button"
                  onClick={() => openProject(p, filteredIndex)}
                  className={`water-card glass-panel group relative rounded-3xl overflow-hidden aspect-[4/3] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal ${
                    i % 7 === 0
                      ? "lg:col-span-2 lg:aspect-[16/9]"
                      : i % 7 === 4
                        ? "lg:row-span-2 lg:aspect-auto min-h-[430px]"
                        : ""
                  }`}
                >
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.title}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-panel-2 to-ink" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/20 to-transparent opacity-90 group-hover:opacity-100 transition duration-500" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-[radial-gradient(circle_at_50%_80%,rgba(30,202,201,0.15),transparent_50%)]" />
                  <span className="absolute top-4 right-4 rounded-full border border-white/20 bg-ink/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/90 backdrop-blur-md opacity-0 translate-y-2 scale-95 transition-all duration-400 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100">
                    View project
                  </span>
                  <div className="absolute bottom-0 inset-x-0 p-6 translate-y-1 group-hover:translate-y-0 transition duration-400">
                    <p className="text-gold text-xs tracking-widest uppercase">{p.tag || "DW AdSign"}</p>
                    <h3 className="font-display font-bold text-xl mt-1 group-hover:text-gradient transition-colors">
                      {p.title}
                    </h3>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel rounded-3xl p-12 text-center text-fog">
            <p className="text-4xl mb-4 opacity-40">◇</p>
            No projects in this category yet.
          </div>
        )}

        {visible < filtered.length && (
          <div className="mt-12 text-center">
            <button
              onClick={() => setVisible((v) => v + 9)}
              className="group relative overflow-hidden rounded-full border border-teal/50 bg-teal/10 px-8 py-3.5 text-sm font-bold text-teal hover:bg-teal hover:text-ink transition duration-300 hover:shadow-[0_0_32px_rgba(30,202,201,0.4)]"
            >
              <span className="relative z-10">
                Load more · {Math.min(9, filtered.length - visible)} projects
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Full-screen lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={selected.title}
          onClick={() => setSelected(null)}
        >
          <div className="absolute inset-0 bg-ink/90 backdrop-blur-2xl animate-in fade-in duration-300" />

          <div
            className="relative max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[1.75rem] border border-white/15 bg-panel/95 shadow-[0_40px_100px_rgba(0,0,0,0.6)] animate-in zoom-in-95 fade-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setSelected(null)}
              className="absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-ink/70 text-white backdrop-blur-md border border-white/10 hover:bg-gold hover:text-ink hover:border-gold transition duration-200"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            {/* Nav arrows */}
            {filtered.length > 1 && (
              <>
                <button
                  onClick={() => navigate(-1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-ink/60 text-white backdrop-blur-md border border-white/10 hover:bg-teal hover:text-ink hover:border-teal transition duration-200"
                  aria-label="Previous project"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M15 6l-6 6 6 6" />
                  </svg>
                </button>
                <button
                  onClick={() => navigate(1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-ink/60 text-white backdrop-blur-md border border-white/10 hover:bg-teal hover:text-ink hover:border-teal transition duration-200"
                  aria-label="Next project"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </>
            )}

            {selected.image ? (
              <div className="relative bg-ink min-h-[40vh] flex items-center justify-center">
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-10 w-10 rounded-full border-2 border-teal/30 border-t-teal animate-spin" />
                  </div>
                )}
                <img
                  src={selected.image}
                  alt={selected.title}
                  onLoad={() => setImageLoaded(true)}
                  className={`max-h-[78vh] w-full object-contain transition-opacity duration-500 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                />
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center text-fog">Project image not available.</div>
            )}

            <div className="p-5 sm:p-6 flex items-center justify-between gap-4 border-t border-white/10 bg-panel/80 backdrop-blur-xl">
              <div>
                <p className="text-gold text-xs tracking-widest uppercase">{selected.tag || "DW AdSign"}</p>
                <h3 className="font-display text-2xl font-bold mt-0.5">{selected.title}</h3>
              </div>
              <div className="flex items-center gap-3 text-xs text-fog shrink-0">
                {filtered.length > 1 && (
                  <span className="hidden sm:inline tabular-nums">
                    {selectedIndex + 1} / {filtered.length}
                  </span>
                )}
                <span className="hidden md:inline opacity-60">← → navigate · Esc close</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
