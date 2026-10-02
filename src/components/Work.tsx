import type { ProjectItem } from "@/lib/settings";
export default function Work({ projects }: { projects: ProjectItem[] }) {
  return (
    <section id="work" className="relative px-5 sm:px-6 py-24 border-t border-white/10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16"><p className="text-teal text-sm font-semibold tracking-[0.3em] uppercase mb-4">Selected work</p><h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">Built. Lit. Installed.</h2></div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => {
            const card = <div className={`water-card glass-panel group relative rounded-2xl overflow-hidden aspect-[4/3] ${i % 5 === 0 || i % 5 === 4 ? "lg:col-span-2" : ""}`}>
              {p.image ? <img src={p.image} alt={p.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition duration-700" /> : <div className="absolute inset-0 bg-gradient-to-br from-panel-2 to-ink" />}
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/15 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-6"><p className="text-gold text-xs tracking-widest uppercase">{p.tag}</p><h3 className="font-display font-bold text-lg">{p.title}</h3>{p.url && <p className="mt-2 text-xs text-teal">Open project ↗</p>}</div>
            </div>;
            return p.url ? <a key={`${p.title}-${i}`} href={p.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${p.title}`}>{card}</a> : <div key={`${p.title}-${i}`}>{card}</div>;
          })}
        </div>
      </div>
    </section>
  );
}
