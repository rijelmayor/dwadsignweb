"use client";

import { useMemo, useState } from "react";
import type { ProjectItem } from "@/lib/settings";

export default function Work({ projects }: { projects: ProjectItem[] }) {
  const [filter, setFilter] = useState("All");
  const [visible, setVisible] = useState(9);
  const [selected, setSelected] = useState<ProjectItem | null>(null);

  const categories = useMemo(() => ["All", ...Array.from(new Set(projects.map((p) => p.tag.trim()).filter(Boolean)))], [projects]);
  const filtered = useMemo(() => filter === "All" ? projects : projects.filter((p) => p.tag.trim() === filter), [projects, filter]);
  const shown = filtered.slice(0, visible);

  function changeFilter(next: string) {
    setFilter(next);
    setVisible(9);
  }

  return (
    <section id="work" className="relative px-5 sm:px-6 py-24 border-t border-white/10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <p className="text-teal text-sm font-semibold tracking-[0.3em] uppercase mb-4">Selected work</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">Built. Lit. Installed.</h2>
            <p className="mt-4 max-w-2xl text-fog">A living portfolio of signs, print, branding and display work by DW AdSign.</p>
          </div>
          {categories.length > 1 && <div className="flex flex-wrap gap-2 lg:justify-end">
            {categories.map((cat) => <button key={cat} onClick={() => changeFilter(cat)} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${filter === cat ? "bg-gold text-ink" : "glass-panel text-fog hover:text-white hover:border-teal/60"}`}>{cat}</button>)}
          </div>}
        </div>

        {shown.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p, i) => <button key={`${p.title}-${i}`} type="button" onClick={() => setSelected(p)} className={`water-card glass-panel group relative rounded-3xl overflow-hidden aspect-[4/3] text-left ${i % 7 === 0 ? "lg:col-span-2 lg:aspect-[16/9]" : i % 7 === 4 ? "lg:row-span-2 lg:aspect-auto min-h-[430px]" : ""}`}>
            {p.image ? <img src={p.image} alt={p.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" /> : <div className="absolute inset-0 bg-gradient-to-br from-panel-2 to-ink" />}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/10 to-transparent" />
            <span className="absolute top-4 right-4 rounded-full border border-white/20 bg-ink/45 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/90 backdrop-blur-md opacity-0 translate-y-1 transition group-hover:opacity-100 group-hover:translate-y-0">View project</span>
            <div className="absolute bottom-0 inset-x-0 p-6"><p className="text-gold text-xs tracking-widest uppercase">{p.tag || "DW AdSign"}</p><h3 className="font-display font-bold text-xl mt-1">{p.title}</h3></div>
          </button>)}
        </div> : <div className="glass-panel rounded-3xl p-12 text-center text-fog">No projects in this category yet.</div>}

        {visible < filtered.length && <div className="mt-10 text-center"><button onClick={() => setVisible((v) => v + 9)} className="rounded-full border border-teal/50 bg-teal/10 px-7 py-3 text-sm font-bold text-teal hover:bg-teal hover:text-ink transition">Load more · {Math.min(9, filtered.length - visible)} projects</button></div>}
      </div>

      {selected && <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-8" role="dialog" aria-modal="true" aria-label={selected.title} onClick={() => setSelected(null)}>
        <div className="absolute inset-0 bg-ink/85 backdrop-blur-xl" />
        <div className="relative max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-white/15 bg-panel/90 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setSelected(null)} className="absolute right-4 top-4 z-10 h-10 w-10 rounded-full bg-ink/70 text-white backdrop-blur hover:bg-gold hover:text-ink transition" aria-label="Close">×</button>
          {selected.image ? <img src={selected.image} alt={selected.title} className="max-h-[78vh] w-full object-contain bg-ink" /> : <div className="h-96 flex items-center justify-center text-fog">Project image not available.</div>}
          <div className="p-5 sm:p-6 flex items-center justify-between gap-4"><div><p className="text-gold text-xs tracking-widest uppercase">{selected.tag || "DW AdSign"}</p><h3 className="font-display text-2xl font-bold">{selected.title}</h3></div><span className="hidden sm:block text-xs text-fog">Click outside to close</span></div>
        </div>
      </div>}
    </section>
  );
}
