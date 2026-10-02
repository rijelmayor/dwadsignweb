import type { ServiceItem } from "@/lib/settings";

export default function Services({ services, background }: { services: ServiceItem[]; background: string }) {
  const cols = services.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3";
  return (
    <section id="services" className="relative px-5 sm:px-6 py-24 overflow-hidden">
      {background && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${JSON.stringify(background)})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/80 to-ink" />
      <div className="pointer-events-none absolute top-1/2 left-0 h-64 w-64 -translate-y-1/2 rounded-full bg-gold/5 blur-[80px]" />
      <div className="pointer-events-none absolute top-1/2 right-0 h-64 w-64 -translate-y-1/2 rounded-full bg-teal/5 blur-[80px]" />
      <div className="relative mx-auto max-w-7xl">
        <p className="text-teal text-sm font-semibold tracking-[0.3em] uppercase mb-4">What we do</p>
        <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-16">
          Everything your brand needs to be seen.
        </h2>
        <div className={`grid gap-6 sm:grid-cols-2 ${cols}`}>
          {services.map((s) => (
            <div
              key={s.title}
              className="water-card glass-panel group relative min-h-[280px] rounded-3xl overflow-hidden p-8 hover:-translate-y-2 transition duration-500 hover:shadow-[0_20px_60px_rgba(30,202,201,0.12)]"
            >
              {s.background && (
                <img
                  src={s.background}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 h-full w-full object-cover opacity-35 group-hover:scale-110 group-hover:opacity-50 transition duration-700"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/65 to-ink/20" />
              <div className="relative z-10 flex h-full min-h-[220px] flex-col justify-end">
                <div className="text-gold text-3xl mb-5 transition duration-300 group-hover:scale-110 group-hover:text-teal origin-left">
                  {s.icon}
                </div>
                <h3 className="font-display text-xl font-bold mb-3 group-hover:text-gradient transition-colors">
                  {s.title}
                </h3>
                <p className="text-fog text-sm leading-relaxed max-w-md">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
