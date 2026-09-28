const projects = [
  { title: "Neon Café Identity", tag: "LED Neon", span: "lg:col-span-2" },
  { title: "Retail Lightbox Wall", tag: "Lightbox", span: "" },
  { title: "Fleet Branding — 12 Vans", tag: "Vehicle Wrap", span: "" },
  { title: "Office Wayfinding Suite", tag: "Signage", span: "" },
  { title: "Mall Atrium Mural", tag: "Wall Mural", span: "lg:col-span-2" },
];

export default function Work() {
  return (
    <section id="work" className="px-6 py-24 border-t border-line">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between mb-16 flex-wrap gap-4">
          <div>
            <p className="text-volt text-sm font-semibold tracking-[0.3em] uppercase mb-4">
              Selected work
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
              Built. Lit. Installed.
            </h2>
          </div>
          <p className="text-fog max-w-sm text-sm">
            Replace these placeholders with your project photos. Each card links to a
            case study page when you are ready.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <div
              key={p.title}
              className={`group relative rounded-2xl border border-line bg-panel overflow-hidden aspect-[4/3] ${p.span}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-panel to-ink group-hover:scale-105 transition duration-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-line text-6xl font-display font-bold group-hover:text-volt transition">
                  {p.title.charAt(0)}
                </span>
              </div>
              <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-ink to-transparent">
                <p className="text-volt text-xs tracking-widest uppercase">{p.tag}</p>
                <h3 className="font-display font-bold text-lg">{p.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
