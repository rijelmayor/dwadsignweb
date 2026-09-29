import type { ProjectItem } from "@/lib/settings";
export default function Work({ projects }: { projects: ProjectItem[] }) {
  return (
    <section id="work" className="px-6 py-24 border-t border-line">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16">
          <p className="text-teal text-sm font-semibold tracking-[0.3em] uppercase mb-4">Selected work</p>
          <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">Built. Lit. Installed.</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <div key={`${p.title}-${i}`}
              className={`group relative rounded-2xl border border-line bg-panel overflow-hidden aspect-[4/3] ${i % 5 === 0 || i % 5 === 4 ? "lg:col-span-2" : ""}`}>
              {p.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image} alt={p.title} loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition duration-500" />
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-panel-2 to-ink group-hover:scale-105 transition duration-500" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-line text-6xl font-display font-bold group-hover:text-gold transition">{p.title.charAt(0)}</span>
                  </div>
                </>
              )}
              <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-ink to-transparent">
                <p className="text-gold text-xs tracking-widest uppercase">{p.tag}</p>
                <h3 className="font-display font-bold text-lg">{p.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
